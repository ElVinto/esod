import {useState,useEffect} from 'react'
import Table from 'react-bootstrap/Table';
import { Card } from 'react-bootstrap';
import { getMetaDataId,getDatasetUri } from '../../util/prefix_util';

export default function RetrievedDatasetVarTable({selectedLabel, kbUri, setDatasetUriCallBack}){

    
    const [varNames,setVarNames] = useState([]);
    const [bindings, setBindings] = useState([]);

    const [fetchingData, setFetchingData] = useState(false);

    
    function composeQuery(){
        return ` 
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            PREFIX sosa: <http://www.w3.org/ns/sosa/> 
            PREFIX ucmm: <http://purl.org/ucmm#> 
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
            PREFIX dcat: <http://www.w3.org/ns/dcat#> 
            PREFIX dcterms: <http://purl.org/dc/terms/> 
            PREFIX prov: <http://www.w3.org/ns/prov#>

            SELECT DISTINCT ?dataset ?title ?provenance
            WHERE{ 
              { 
                ?dataset rdf:type dcat:Dataset . 
                ?dataset ?p ?concept .  
                ?concept skos:prefLabel ?searchLabel .

                OPTIONAL{
                    ?dataset  dcterms:title ?title.
                }
                OPTIONAL{
                    ?dataset  prov:wasGeneratedBy ?provenance.
                }  

              }UNION{ 
                ?dataset rdf:type dcat:Dataset . 
                ?dataset dcterms:description|dcterms:title|dcat:keyword ?searchLabel.  

                OPTIONAL{
                    ?dataset  dcterms:title ?title.
                }
                OPTIONAL{
                    ?dataset  prov:wasGeneratedBy ?provenance.
                }

              }UNION{ 
                ?dataset rdf:type dcat:Dataset . 
                ?obsColl ucmm:hasAggregatedResult ?dataset . 
                ?obsColl rdf:type sosa:ObservationCollection .
                ?obsColl  ?obsCollProp ?concept. 
                ?concept skos:prefLabel ?searchLabel . 

                OPTIONAL{
                    ?dataset  dcterms:title ?title.
                }
                OPTIONAL{
                    ?dataset  prov:wasGeneratedBy ?provenance.
                }

              }UNION{ 
                ?obsColl  (^sosa:hasMember)%2B ?obsCollParent.
                ?obsColl  ?obsCollProp ?concept. 
                ?concept skos:prefLabel ?searchLabel .
                OPTIONAL{
                    ?dataset rdf:type dcat:Dataset . 
                    ?obsCollParent ucmm:hasAggregatedResult ?dataset . 
                }

                OPTIONAL{
                    ?dataset  dcterms:title ?title.
                }
                OPTIONAL{
                    ?dataset  prov:wasGeneratedBy ?provenance.
                }
              }
              FILTER (strlen(str(?dataset)) > 0)
              FILTER (regex(?searchLabel,"${selectedLabel}","i") )
              FILTER (lang(?searchLabel)="en")
            }`.toString().replace('\n',' ');
    }

    async function fetchData () {

        try {  

            setFetchingData(true)
            // console.log(` fetchData()`)
            // console.log('  composeQuery : ',composeQuery());

            const response = await fetch(kbUri,{
                method: "POST",
                credentials: "same-origin",
                headers:{
                    "Content-Type": 'application/x-www-form-urlencoded',
                    "xhrFields": {withCredentials: true},
                    "Accept" : "application/json",
                },
                redirect: "follow",
                referrerPolicy: "no-referrer",
                body: "query="+ composeQuery()
            }
            )            
            
            const jsonData = await response.json();
            
            // console.log('  jsonData:', jsonData);
            
            if(jsonData){

                if(jsonData.results){
                    if(jsonData.results.bindings){
                        setBindings(jsonData.results.bindings);
                    }}

                if(jsonData.head){
                    if(jsonData.head.vars){
                        setVarNames(jsonData.head.vars);
                    }
                }
                
            }
            setFetchingData(false);
            // console.log('varNames:', varNames); 
            // console.log('bindings:', bindings);

        } catch (error) {
            console.log(' Error:', error);
            
        }
    }

    function handleClickCell(e){

        console.log('e',e);

        const metadatId = e.target.innerText;
        const datasetUri = getDatasetUri(metadatId);
        // console.log('handleClickCell RetrievedDatasetVarTable')
        // console.log(' clicked datasetUri: ',datasetUri);
        setDatasetUriCallBack(datasetUri);

    }

    useEffect (
         () =>{

            if(selectedLabel === ''){
                return;
            }

            // console.log(`useEffect RetrieveDatasetVarTable`)
            // console.log(' kbUri : ',kbUri);
            // console.log(' selectedLabel : ',selectedLabel);

            
            fetchData();
            
        },
        [selectedLabel]
    );

    

 
    return(
        <Card>
            <Card.Header>
                { bindings.length>0?(
                    `Retrieved Dataset Metadata: ${bindings.length} (Click on metadata IDs for details)`
                ):(
                    `Retrieved Dataset Metadata`
                )
            
                }
            </Card.Header>
            {
                selectedLabel!==''?(
                    varNames.length>0 ?(
                        <div style={{overflow:"scroll", width:"100%", maxHeight:"400px"}}>
                            {/* <p>{`#found: ${bindings.length} `}</p> */}
                            <Card.Body >
                            
                                <Table striped bordered hover responsive size='lg' onClick={e=>handleClickCell(e)}  >
                                    <thead >
                                        {varNames.map(v => <th text-align="center"> {`${v}(s)`} </th> )}
                                    </thead>
                                    
                                    <tbody >
                                        
                                        {bindings.map(binding =>
                                            <tr>
                                                {varNames.map(varName =>

                                                    binding[varName]===undefined?(
                                                        <td></td>
                                                    ):(
                                                        <td > {getMetaDataId(binding[varName]["value"])} </td>
                                                    )
                                                    
                                                )}
                                            </tr>
                                        )}
                                        
                                    </tbody>
                                    
                                </Table>
                            </Card.Body> 
                        </div >
                    ):(
                        !fetchingData? (
                            <p> {` No Dataset matches: ${selectedLabel} `}  </p>
                        ):(
                            <p> {` Retrieving datasets for: ${selectedLabel} `}  </p>
                        )
                    )
                ):(
                    <></>
                )
            }
        </Card>  
    )
}
