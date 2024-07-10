import { useEffect, useState } from "react";
import { Card } from "react-bootstrap";

import {getPrefixedUri, getMetaDataId, getProvService, getProvPage, dataHubName} from '../util/prefix_util'


export default function DatasetCard({datasetUri,kbUri}){

    const [datasetInfo,setDatasetInfo]= useState({
        /*
            dcterms:title:
            dcterms:description:
            TODO
            theme:
            keyword:
        */
    })

    

    useEffect(
        ()=>{
            if(datasetUri !=''){
                fetchDatasetInfo(kbUri,datasetUri).then(resultDatasetInfo =>{
                    setDatasetInfo(resultDatasetInfo);
                })
            }
        },
        [datasetUri]
    );

    async function fetchDatasetInfo(kbUri,datasetUri){

        return new Promise( async (resolve,reject)=>{
            try { 

                const queryTxt= `
                    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    PREFIX dcat: <http://www.w3.org/ns/dcat#>
                    PREFIX dcterms: <http://purl.org/dc/terms/>
                    PREFIX prov: <http://www.w3.org/ns/prov#>

                    SELECT ?datasetProp ?datasetObj
                    WHERE{
                        values ?datasetProp {dcterms:description dcterms:title prov:wasGeneratedBy}
                        <${datasetUri}> rdf:type dcat:Dataset .
                        <${datasetUri}> ?datasetProp ?datasetObj .
                    }
                `.toString().replace('\n',' ');

                // console.log('queryTxt',queryTxt);

                const response = await fetch(kbUri,{
                    method: "POST",
                    // credentials: "same-origin",
                    headers:{
                        "Content-Type": 'application/x-www-form-urlencoded',
                        // "xhrFields": {withCredentials: true},
                        "Accept" : "application/json",
                    },
                    // redirect: "follow",
                    // referrerPolicy: "no-referrer",
                    body: "query="+ queryTxt
                }
                )

                const jsonData = await response.json();
                    
                console.log('jsonData:', jsonData);

                let resultDatasetInfo = {};

                if(jsonData){
                    if(jsonData.results){
                        if(jsonData.results.bindings){
                            if(jsonData.results.bindings.length>0){

                                jsonData.results.bindings.map( binding =>{

                                    
                                    const datasetProp = getPrefixedUri(binding['datasetProp']['value']);
                                    const datasetObj =  getPrefixedUri(binding['datasetObj']['value']);


                                    resultDatasetInfo = {
                                        ...resultDatasetInfo,
                                        [datasetProp]:datasetObj
                                    }
                                })
                            }
                        }
                    }

                }

                console.log('tmpDatasetInfo : ',resultDatasetInfo)

                resolve( resultDatasetInfo);
            
            } catch (error) {
                console.error('Error fetching Tree data:', error);
                reject(error);
            }
        })
    }

    return (
        <Card>
            <Card.Header>
                Selected dataset details
            </Card.Header>

            {(datasetUri!=='')?(
                <Card.Body>
                
                    <dl>
                        <dt> id:</dt>
                        <dd> {getMetaDataId(datasetUri)}</dd>

                        {datasetInfo['prov:wasGeneratedBy']?
                        (
                            <>
                                <dt> provenance: </dt>
                                {/* <dd> {dataHubName(datasetInfo['prov:wasGeneratedBy'])}</dd> */}

                                <dd><a href={getProvPage(datasetInfo['prov:wasGeneratedBy'],datasetUri)} target="_blank" rel="noopener noreferrer">{`${dataHubName(datasetInfo['prov:wasGeneratedBy'])} description`} </a></dd>
                                <dd><a href={getProvService(datasetInfo['prov:wasGeneratedBy'],datasetUri)} target="_blank" rel="noopener noreferrer">{`${dataHubName(datasetInfo['prov:wasGeneratedBy'])} metadata`}</a></dd>
                            </>
                        ):(
                            <></>
                        )
                        }
                        <dt> title: </dt>
                        <dd> {datasetInfo['dcterms:title']}</dd>

                        {datasetInfo['dcterms:description']?
                        (
                            <>
                                <dt> description:</dt>
                                <dd> 
                                    <div style={{overflow:"scroll", width:"100%", maxHeight:"350px"}}>
                                    {datasetInfo['dcterms:description']}
                                    </div>
                                </dd>
                            </>
                        ):(
                            <></>
                        )
                        }
                        {/* {
                        Object.keys(datasetInfo).map( datasetProp =>
                        <>
                            <dt> {datasetProp}</dt>
                            <dd> {datasetInfo[datasetProp]}</dd>
                        </>)
                        } */}
                    </dl>
                
                </Card.Body>
            ):(
                <></>
            )
            }
        </Card>
    )

}