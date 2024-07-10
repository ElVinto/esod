import * as d3 from 'd3';
import { useEffect, useState, useRef } from "react";
import { RADIUS, drawNetwork } from './drawNetwork';
import React from 'react';
import ForceUndirectedD3Graph from './ForceUndirectedD3Graph';



export default function DatasetDiscoveryExplainedSVGGraph ({kbUri, termInfo, width, height}){

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

        'skos:':5,
        'sosa:':6,
        'ucmm:':7,
        'rdf:': 8,
        'dcat:':9,
        'dcterms:':10
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

    const [currentlyExplainedTerm, setCurrentlyExplainedTerm] = useState('');
    const [currentlyVisualisedTerm, setCurrentlyVisualisedTerm] = useState('');

 

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

    function xQueryDatasetsFromObsCol(term){

        console.log(`xQueryDatasetsFromObsCol`);

        // # ?obsCollDatasetProp {ucmm:hasAggregatedResult}
        // # ?obsCollProp (sosa:hasFeatureofInterest|sosa:hasUltimateFeatureofInterest|sosa:observedProperty)
        return (`PPREFIX skos: <http://www.w3.org/2004/02/skos/core#> 
        PREFIX sosa: <http://www.w3.org/ns/sosa/> 
        PREFIX ucmm: <http://purl.org/ucmm#> 
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
        PREFIX dcat: <http://www.w3.org/ns/dcat#> 
        PREFIX dcterms: <http://purl.org/dc/terms/> 
        SELECT DISTINCT ?dataset ?obsCollDatasetProp ?obsColl ?obsCollProp ?skosConcept ?litMentioningSearchLabel
        WHERE{
            VALUES ?obsCollDatasetProp {ucmm:hasAggregatedResult}
            ?dataset rdf:type dcat:Dataset .
            ?obsColl ?obsCollDatasetProp ?dataset .
            ?obsColl  ?obsCollProp ?skosConcept. 
            ?skosConcept skos:prefLabel ?litMentioningSearchLabel . 
          FILTER ( 
            regex(?litMentioningSearchLabel,"${term}","i") 
          )
          FILTER (
            lang(?litMentioningSearchLabel)="en"
          )
        }`).replace('\n',' ');
    }


    function containId(nodes,searchId){
        for(const node of nodes){
            if( node.id === searchId){
                return true;
               }
        }
        return false;
    }

    
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
            
            let subjects= [];
            let properties = [];
            let objects = [];

            

            if(jsonData){

                if(jsonData.results){
                    if(jsonData.results.bindings){
                        if(jsonData.results.bindings.length>0){

                            jsonData.results.bindings.map( binding =>{
                                const datasetNodeId =  getPrefixedUri(binding['dataset']['value']);
                                const datasetProp = getPrefixedUri(binding['datasetProp']['value']);

                                const datasetPropNodeId = datasetNodeId.substring(0,datasetNodeId.indexOf(":")+1)
                                + datasetProp.substring(datasetProp.indexOf(":")+1);

                                const litMentioningSearchLabel= binding['litMentioningSearchLabel']['value'];

                                if(!containId(tmpD3Graph.nodes,datasetNodeId)){
                                    tmpD3Graph.nodes.push({
                                        id: datasetNodeId,
                                        group: getGroupFromPrefixedUri(datasetNodeId)
                                    });
                                }

                                if(!tmpD3Graph.nodes.includes(datasetPropNodeId)){
                                    tmpD3Graph.nodes.push({
                                        id: datasetPropNodeId,
                                        group: getGroupFromPrefixedUri(datasetPropNodeId)
                                    });
                                }

                                tmpD3Graph.links.push({
                                    source: tmpD3Graph.nodes[0].id,
                                    target: datasetPropNodeId,
                                    value: 1
                                })

                                tmpD3Graph.links.push({
                                    source: datasetNodeId,
                                    target: datasetPropNodeId,
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


            console.log(`useEffect DatasetDiscoveryExplainedSVGGraph`)
            console.log(` termInfo.term`,termInfo.term)
            console.log(` currentExlainedTerm`, currentlyExplainedTerm )
            console.log(` currentlyVisualisedTerm`, currentlyVisualisedTerm )

            console.log(` d3Graph`,d3Graph)

            if(termInfo.term === '' ){
                return;
            }
               

            if(d3Graph.nodes.length===0 || termInfo.term != currentlyExplainedTerm ){

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
                        setD3Graph(tmpD3Graph);
                        setCurrentlyExplainedTerm(termInfo.term);
                    }


                    console.log(` updatedExplanation: ${updatedExplanation}`)
                })

                // NOTE that since explainDatasetsFromDescAndTitle is asynchonous the main process may return before reaching the end of explainDatasetsFromDescAndTitle
                if(currentlyVisualisedTerm!==''){
                    if(d3.selectAll('g')){
                        d3.selectAll('g').remove();
                        console.log(`  d3.selectAll('g').remove()`);
                    }
                }

                return;

            }
            
            if(d3Graph.nodes.length>0 && (currentlyVisualisedTerm==='' || currentlyExplainedTerm !== currentlyVisualisedTerm )){

                console.log(` draw d3Graph `,d3Graph);


                
                
                 // Specify the color scale. or schemePaired for 12 colors
                const color = d3.scaleOrdinal(d3.schemeCategory10);

                // The force simulation mutates links and nodes, so create a copy
                // so that re-evaluating this cell produces the same result.
                const links = d3Graph.links.map(d => ({...d}));
                const nodes = d3Graph.nodes.map(d => ({...d}));

                
                
                // Create a simulation with several forces.
                const simulation = d3.forceSimulation(nodes)
                    .force("link", d3.forceLink(links).id(d => d.id))
                    .force("charge", d3.forceManyBody())
                    .force("center", d3.forceCenter(width / 2, height / 2))
                    .on("tick", ticked);

                // Create the SVG container.
                const svg = d3.select("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("viewBox", [0, 0, width, height])
                    .attr("style", "max-width: 100%; height: auto;")
                ;


                // Add a line for each link, and a circle for each node.
                const link = svg.append("g")
                    .attr("stroke", "#999")
                    .attr("stroke-opacity", 0.6)
                    .selectAll()
                    .data(links)
                    .join("line")
                    .attr("stroke-width", d => Math.sqrt(d.value));

                const node = svg.append("g")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                    .selectAll()
                    .data(nodes)
                    .join("circle")
                    .attr("r", 5)
                    .attr("fill", d => color(d.group));

                    // Add a drag behavior.
                // node.call(d3.drag()
                // .on("start", dragstarted)
                // .on("drag", dragged)
                // .on("end", dragended));

                const drag_handler = d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
          
                drag_handler(node);

                // node.append("title")
                //     .text(d => d.id);
                    // .attr("style","font-family: sans-serif; font-size: 10px;");
                    // .attr('x', 11)
                    // .attr('y', 3);

                node.append("text")
                    .text(d => d.id)
                    .attr("text-anchor","middle")
                    .attr("alignment-baseline", "middle")
                    .attr("style","font-family: sans-serif; font-size: 10;  ")
                    .attr('x', 6)
                    .attr('y', 3);

                simulation
                    .nodes(nodes)
                    .on("tick", ticked);
              
                simulation.force("link")
                    .links(links);
                   

                

                // Set the position attributes of links and nodes each time the simulation ticks.
                function ticked() {
                    link
                        .attr("x1", d => d.source.x) // DatasetDiscoveryExplainedSVGGraph.js:364 Uncaught TypeError: Cannot read properties of undefined (reading 'attr')
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);

                    node
                        // .attr("cx", d => d.x)
                        // .attr("cy", d => d.y);
                        .attr("transform", function(d) {
                            return "translate(" + d.x + "," + d.y + ")";
                          })
                }

                // Reheat the simulation when drag starts, and fix the subject position.
                function dragstarted(event) {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                }

                // Update the subject (dragged node) position during drag.
                function dragged(event) {
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                }

                // Restore the target alpha so the simulation cools after dragging ends.
                // Unfix the subject position now that it’s no longer being dragged.
                function dragended(event) {
                    if (!event.active) simulation.alphaTarget(0);
                    event.subject.fx = null;
                    event.subject.fy = null;
                }

                // When this cell is re-run, stop the previous simulation. (This doesn’t
                // really matter since the target alpha is zero and the simulation will
                // stop naturally, but it’s a good practice.)
                //  simulation.stop();


                setCurrentlyVisualisedTerm(currentlyExplainedTerm);

                

            }



        }, [termInfo, d3Graph] // nodes, links
    );

    return(
        <div>
            {d3Graph.nodes.length>0?(
                <svg id='svg'
                    // ref={svgRef}
                    style={{
                        width,
                        height
                    }}
                    width={width}
                    height={height}
                />
            ):(
                <></>
            )
            }
        </div>
    )
}