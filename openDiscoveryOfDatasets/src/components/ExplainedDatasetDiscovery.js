import { useEffect, useState, useRef } from "react";
import React from 'react';
import ForceUndirectedD3Graph from './ForceUndirectedD3Graph';



export default function ExplainedDatasetDiscovery ({kbUri, termInfo, width, height}){

    const prefix2uri = {
        'skos:':'http://www.w3.org/2004/02/skos/core#',
        'sosa:': 'http://www.w3.org/ns/sosa/',
        'ucmm:':'http://purl.org/ucmm#',
        'rdf:': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'dcat:':'http://www.w3.org/ns/dcat#',
        'dcterms:':'http://purl.org/dc/terms/',

        'i1:':'http://example.org/b2a5ed57-5c4e-4596-b803-d2ac7f5b9991#',
        'i2:':'http://example.org/51824c86-ae0f-442f-9df2-e86244984ba3#',
        'i3:':'http://example.org/97b4842b-94b3-4205-8781-476813d8177b#',
        'i4:':'http://example.org/e747d804-a5d1-4fd1-bd9b-306a8ebd4904#',
        'i5:': 'http://example.org/de5b570a-b560-4e84-a755-52c2aa499874#',
        'i6:': 'http://example.org/3df904de-e47d-4bf9-85a0-7c0942aff8b6#',
        'i7:': 'http://example.org/BDML_TCHR#',
        'i8:': 'http://example.org/4f676524-a831-41fe-9afb-d95f4e7597e3#',
        'i9:': 'http://example.org/f4968943-ad6f-4563-a737-58fe3285fb3c#',
        'i10:': 'http://example.org/17e24931-ccd6-4de0-a01c-9ffb3be88461#'
    };

    function getPrefixFromUri(resourceUri){

        // console.log(`getPrefixFromUri(resourceUri: ', ${resourceUri})`);

        let prefix = '';
        Object.entries(prefix2uri).map( ([prefixKey,uri]) => {
            if(resourceUri.includes(uri)){
                // console.log(` resourceUri.includes(${uri})`);
                prefix = prefixKey;
                return; // exit map function
            }
        })

        // console.log(` prefix: ', ${prefix}`);

        return prefix;
    }
    
    function getPrefixedUri(resourceUri){

        // console.log(`getPrefixedUri(resourceUri: ', ${resourceUri})`);

        const prefix = getPrefixFromUri(resourceUri);

        if(prefix==='')
            return resourceUri;

        const prefixUri = prefix2uri[prefix];
        const prefixedUri = resourceUri.replace(prefixUri,prefix);

        // console.log(` prefixedUri: ', ${prefixedUri}`);

        return prefixedUri;
    }

    const prefix2group ={ // THEAI ODATIS FORMATER AERIS
        'i1:': 1,
        'i2:': 1,
        'i3:': 1,
        'i4:': 2,
        'i5:': 2,
        'i6:': 2,
        'i7:': 3,
        'i8:': 3,
        'i9:': 3,
        'i10:': 3,
    }

    function getGroupFromPrefixedUri(prefixedUri){
        const prefix= prefixedUri.substring(0,prefixedUri.indexOf(":")+1)

        
        if(prefix2group[prefix]){
            return prefix2group[prefix];
        }else{
            return 4;
        }
    }


    const [d3Graph,setD3Graph]= useState({
        nodes:[
            // {
            //     id: String,
            //     group:Int32Array,
            // }
        ],
        links:[
            // {
            //     source: String,
            //     target: String,
            //     value: Int16Array
            // }
        ]
    });

    // Todo instanciate in case of several graph manipulations
    // const [spod,setSPOD]= useState({
    //     subjects: [],
    //     properties: [],
    //     objects: [],
    //     d3LinkIndexes: [] //
    // });

    function xQueryDatasetsFromDescAndTitle(){

        console.log(`xQueryDatasetsFromDescAndTitle`);

        return (`PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX sosa: <http://www.w3.org/ns/sosa/>
        PREFIX ucmm: <http://purl.org/ucmm#> 
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
        PREFIX dcat: <http://www.w3.org/ns/dcat#> 
        PREFIX dcterms: <http://purl.org/dc/terms/> 
        SELECT DISTINCT ?dataset ?datasetProp ?litMentioningSearchLabel
        WHERE{
          VALUES ?datasetProp {dcterms:description dcterms:title}
          ?dataset rdf:type dcat:Dataset . 
          ?dataset ?datasetProp ?litMentioningSearchLabel. 
          FILTER ( 
            regex(?litMentioningSearchLabel,"${termInfo.term}","i") 
          )
          FILTER (
            lang(?litMentioningSearchLabel)="en"
          )
        }`).replace('\n',' ');
    }


    const [currentlyExlainedTerm, setCurrentlyExplainedTerm] = useState('');
    const [currentlyVisualisedTerm, setCurrentlyVisualisedTerm] = useState('');

    const currentGraphId = useRef(1);


    async function explainDatasetsFromDescAndTitle (tmpD3Graph) {
        
        return new Promise (async (resolve,reject) => {

        try {  

            if(!termInfo.term){
                resolve(false);
            }

            console.log('explainDatasetsFromDescAndTitle()')
            console.log(' kbUri : ',kbUri);
            console.log(' termInfo.term : ',termInfo.term);
            console.log(' tmpD3Graph: ',tmpD3Graph);

            

            const queryTxt = xQueryDatasetsFromDescAndTitle();

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
                body: "query="+ queryTxt
            }
            )            
            
            const jsonData = await response.json();
            
            console.log(' jsonData:', jsonData);
            
            

            if(jsonData){

                if(jsonData.results){
                    if(jsonData.results.bindings){
                        if(jsonData.results.bindings.length>0){

                            jsonData.results.bindings.map( binding =>{
                                const datasetNode =  getPrefixedUri(binding['dataset']['value']);
                                const datasetProp = getPrefixedUri(binding['datasetProp']['value']);

                                const datasetPropNode = datasetNode.substring(0,datasetNode.indexOf(":")+1)
                                + datasetProp.substring(datasetProp.indexOf(":")+1);

                                const litMentioningSearchLabel= binding['litMentioningSearchLabel']['value'];

                                
                                if(!tmpD3Graph.nodes.includes(datasetNode)){
                                    tmpD3Graph.nodes.push({
                                        id: datasetNode,
                                        group: getGroupFromPrefixedUri(datasetNode)
                                    });
                                }

                                if(!tmpD3Graph.nodes.includes(datasetPropNode)){
                                    tmpD3Graph.nodes.push({
                                        id: datasetPropNode,
                                        group: getGroupFromPrefixedUri(datasetPropNode)
                                    });
                                }

                                tmpD3Graph.links.push({
                                    source: tmpD3Graph.nodes[0].id,
                                    target: datasetPropNode,
                                    value: 1
                                })

                                tmpD3Graph.links.push({
                                    source: datasetNode,
                                    target: datasetPropNode,
                                    value: 1
                                })

                                
                            })
                        }
                    }
                }

            }

            console.log('tmpD3Graph:', tmpD3Graph);
           resolve(true);
             
        } catch (error) {
            console.log('Error:', error);
            resolve(false);
        }
        })
    }

    // const svgRef = useRef(null);

    // The force simulation mutates links and nodes, so create a copy first
    // Node positions are initialized by d3
    // let links= d3Graph.links.map((d) => ({ ...d }));
    // let nodes= d3Graph.nodes.map((d) => ({ ...d }));

    useEffect( function () {


            console.log(`useEffect ExplainedDatasetDiscovery`)
            console.log(` termInfo.term`,termInfo.term)
            console.log(` currentExlainedTerm`, currentlyExlainedTerm )
            console.log(` currentlyVisualisedTerm`, currentlyVisualisedTerm )

            console.log(` d3Graph`,d3Graph)

            if(termInfo.term === '' ){
                return;
            }
               


            const tmpD3Graph = {
                nodes:[
                    {
                        id:'searchTerm',
                        group:4,
                    }
                ],
                links:[
                    // {
                    //     source: String,
                    //     target: String,
                    //     value: Int16Array
                    // }
                ]
            };
            
            let updatedExplanation = false;
            explainDatasetsFromDescAndTitle(tmpD3Graph).then( (explanationReceived) =>{
                
                updatedExplanation ||=  explanationReceived;

                if(updatedExplanation){

                    currentGraphId.current = currentGraphId.current +1;
                    setD3Graph(tmpD3Graph);
                    setCurrentlyExplainedTerm(termInfo.term);
                }


                console.log(` updatedExplanation: ${updatedExplanation}`)
            })


        }, [termInfo] // nodes, links
    );

    return(
        d3Graph.nodes.length>0?(
            <ForceUndirectedD3Graph graphId={currentGraphId.current} width={width} height={height} d3Graph={d3Graph} ></ForceUndirectedD3Graph>
        ):(
            <></>
        )   
    )
}