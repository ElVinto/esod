import * as d3 from 'd3';
import { useEffect, useState, useRef } from "react";
import { RADIUS, drawNetwork } from './drawNetwork';
import React from 'react';
import ForceUndirectedD3Graph from './ForceUndirectedD3Graph';
import { getLocalUri, getGroupFromPrefixedUri } from '../util/prefix_util';





export default function DatasetExplainedGraph ({kbUri, datasetUri, termInfo, width, height}){


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

    const [currentlyExplainedDataset, setCurrentlyExplainedDataset] = useState('');
    const [currentlyVisualisedDataset, setCurrentlyVisualisedDataset] = useState('');
 
    function containId(nodes,searchId){
        for(const node of nodes){
            if( node.id === searchId){
                return true;
               }
        }
        return false;
    }
  
    async function explainDatasetFromDescriptionTitleKeyword (tmpD3Graph) {
        
        return new Promise (async (resolve,reject) => {

        try {  

            if(!termInfo.term){
                resolve(false);
            }

            console.log('explainDatasetFromDescriptionTitleKeyword()')
            console.log(' kbUri : ',kbUri);
            console.log(' termInfo.term : ',termInfo.term);
            console.log(' tmpD3Graph: ',tmpD3Graph);

            

            const queryTxt = `
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            PREFIX sosa: <http://www.w3.org/ns/sosa/>
            PREFIX ucmm: <http://purl.org/ucmm#> 
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
            PREFIX dcat: <http://www.w3.org/ns/dcat#> 
            PREFIX dcterms: <http://purl.org/dc/terms/> 
            SELECT DISTINCT ?dataset ?datasetProp ?litMentioningSearchLabel
            WHERE{
                BIND( <${datasetUri}> as ?dataset )
                VALUES ?datasetProp {dcterms:description dcterms:title dcat:keyword}
                ?dataset rdf:type dcat:Dataset . 
                ?dataset ?datasetProp ?litMentioningSearchLabel.
                
                FILTER ( 
                    regex(?litMentioningSearchLabel,"${termInfo.term}","i") 
                )
                FILTER (
                    lang(?litMentioningSearchLabel)="en"
                )
            }
            `.replace('\n',' ')

            console.log(' queryTxt:', queryTxt);


            const response = await fetch(kbUri,{
                method: "POST",
                // credentials: "include", // locolhost only
                headers:{
                    "Content-Type": 'application/x-www-form-urlencoded',
                    "Accept" : "application/json",
                },
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


                                const datasetNodeId =  getLocalUri(binding['dataset']['value']);
                                // console.log('datasetNodeId',datasetNodeId)
                                if(!containId(tmpD3Graph.nodes,datasetNodeId)){
                                    tmpD3Graph.nodes.push({
                                        id: datasetNodeId,
                                        group: getGroupFromPrefixedUri(datasetNodeId),
                                        nodeInfo:binding['dataset']['value'],
                                        nodeLabel: datasetNodeId,
                                        nodeType: 'resource', // literal, resource, property, 
                                        nodeUri:binding['dataset']['value']
                                    });
                                }


                                const datasetProp = getLocalUri(binding['datasetProp']['value']);
                                console.log('datasetProp',datasetProp)
                                const datasetPropId = `nodeIdx_${tmpD3Graph.nodes.length}`;
                                console.log('datasetPropId',datasetPropId)
                                tmpD3Graph.nodes.push({
                                    id: datasetPropId,
                                    group: getGroupFromPrefixedUri(datasetProp),
                                    nodeInfo: binding['datasetProp']['value'],
                                    nodeLabel: datasetProp,
                                    nodeType: 'property' // literal, resource, property, 
                                });


                                const litMentioningSearchLabel= binding['litMentioningSearchLabel']['value'];
                                const litId = datasetNodeId.substring(0,datasetNodeId.indexOf(":")+1)+"lit_"+(tmpD3Graph.nodes.length);
                                const litLabel =  datasetNodeId+"."+datasetProp.substring(datasetProp.indexOf(":")+1) ;

                                console.log('litId',litId)
                                tmpD3Graph.nodes.push({
                                    id: litId,
                                    group: getGroupFromPrefixedUri(litId),
                                    nodeInfo: litMentioningSearchLabel,
                                    nodeLabel: litLabel,
                                    nodeType: 'literal' // literal, resource, property, 
                                });

                                const litRelId = `nodeIdx_${tmpD3Graph.nodes.length}`;
                                tmpD3Graph.nodes.push({
                                    id: litRelId,
                                    group: 4,
                                    nodeInfo: 'in',
                                    nodeLabel: ":in",
                                    nodeType: 'property' // literal, resource, property, 
                                });
                                

                                // search label to lit
                                tmpD3Graph.links.push({
                                    source: tmpD3Graph.nodes[0].id,
                                    target: litRelId,
                                    value: 1
                                });

                                tmpD3Graph.links.push({
                                    source: litRelId,
                                    target: litId,
                                    value: 1
                                });

                                   
                                // Dataset to lit

                                tmpD3Graph.links.push({
                                    source: datasetNodeId,
                                    target: datasetPropId,
                                    value: 1
                                });

                                tmpD3Graph.links.push({
                                    source: datasetPropId,
                                    target: litId,
                                    value: 1
                                });



                                
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

    async function explainDatasetFromSubjects (tmpD3Graph) {
        
        return new Promise (async (resolve,reject) => {

        try {  

            if(!termInfo.term){
                resolve(false);
            }

            console.log(' explainDatasetFromSubjects()')
            console.log('  kbUri : ',kbUri);
            console.log('  termInfo.term : ',termInfo.term);
            console.log('  tmpD3Graph: ',tmpD3Graph);

            

            const queryTxt = `
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            PREFIX sosa: <http://www.w3.org/ns/sosa/>
            PREFIX ucmm: <http://purl.org/ucmm#> 
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
            PREFIX dcat: <http://www.w3.org/ns/dcat#> 
            PREFIX dcterms: <http://purl.org/dc/terms/> 
            SELECT DISTINCT ?dataset ?datasetProp ?conceptMentioningSearchLabel ?litMentioningSearchLabel
            WHERE{
                BIND( <${datasetUri}> as ?dataset )
                VALUES ?datasetProp {dcterms:subject }
                ?dataset rdf:type dcat:Dataset.
                ?dataset ?datasetProp ?conceptMentioningSearchLabel. 
                ?conceptMentioningSearchLabel skos:prefLabel ?litMentioningSearchLabel.
                FILTER ( 
                    regex(?litMentioningSearchLabel,"${termInfo.term}","i") 
                )
                FILTER (
                    lang(?litMentioningSearchLabel)="en"
                )
            }
            `.replace('\n',' ')

            const response = await fetch(kbUri,{
                method: "POST",
                // credentials: "include", // locolhost only
                headers:{
                    "Content-Type": 'application/x-www-form-urlencoded',
                    "Accept" : "application/json",
                },

                body: "query="+ queryTxt
            }
            )            
            
            const jsonData = await response.json();
            
            console.log('  jsonData:', jsonData);
            
            

            if(jsonData){

                if(jsonData.results){
                    if(jsonData.results.bindings){
                        if(jsonData.results.bindings.length>0){

                            jsonData.results.bindings.map( binding =>{

                                // ?dataset ?datasetProp ?conceptMentioningSearchLabel ?litMentioningSearchLabel

                                const datasetNodeId =  getLocalUri(binding['dataset']['value']);
                                // console.log('   datasetNodeId',datasetNodeId)
                                if(!containId(tmpD3Graph.nodes,datasetNodeId)){
                                    tmpD3Graph.nodes.push({
                                        id: datasetNodeId,
                                        group: getGroupFromPrefixedUri(datasetNodeId),
                                        nodeInfo:binding['dataset']['value'],
                                        nodeLabel: datasetNodeId,
                                        nodeType: 'resource', // literal, resource, property, 
                                        nodeUri:binding['dataset']['value']
                                    });
                                }


                                const datasetProp = getLocalUri(binding['datasetProp']['value']);
                                console.log('   datasetProp',datasetProp)
                                const datasetPropId = `nodeIdx_${tmpD3Graph.nodes.length}`;
                                console.log('   datasetPropId',datasetPropId)
                                tmpD3Graph.nodes.push({
                                    id: datasetPropId,
                                    group: getGroupFromPrefixedUri(datasetProp),
                                    nodeInfo: binding['datasetProp']['value'],
                                    nodeLabel: datasetProp,
                                    nodeType: 'property' // literal, resource, property, 
                                });


                                const conceptLabel= binding['litMentioningSearchLabel']['value'];
                                const conceptId = getLocalUri(binding['conceptMentioningSearchLabel']['value']);
                                // console.log('   conceptId',conceptId)
                                tmpD3Graph.nodes.push({
                                    id: conceptId,
                                    group: getGroupFromPrefixedUri(conceptId),
                                    nodeInfo: `${conceptId} :\n  ${conceptLabel}`,
                                    nodeLabel: conceptId,
                                    nodeType: 'resource' // literal, resource, property, 
                                });

                                const conceptRelId = `nodeIdx_${tmpD3Graph.nodes.length}`;
                                tmpD3Graph.nodes.push({
                                    id: conceptRelId,
                                    group: 4,
                                    nodeInfo: 'in',
                                    nodeLabel: ":in",
                                    nodeType: 'property' // literal, resource, property, 
                                });
                                

                                // search label to concept
                                tmpD3Graph.links.push({
                                    source: tmpD3Graph.nodes[0].id,
                                    target: conceptRelId,
                                    value: 1
                                });

                                tmpD3Graph.links.push({
                                    source: conceptRelId,
                                    target: conceptId,
                                    value: 1
                                });

                                   
                                // Dataset to concept

                                tmpD3Graph.links.push({
                                    source: datasetNodeId,
                                    target: datasetPropId,
                                    value: 1
                                });

                                tmpD3Graph.links.push({
                                    source: datasetPropId,
                                    target: conceptId,
                                    value: 1
                                });

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
    
    async function explainDatasetFrom3LevelsObsColParams (tmpD3Graph) {
        
        return new Promise (async (resolve,reject) => {

        try {  

            if(!termInfo.term){
                resolve(false);
            }

            console.log('explainDatasetFromDirectlyConectedObsColParams')
            console.log(' kbUri : ',kbUri);
            console.log(' termInfo.term : ',termInfo.term);
            console.log(' tmpD3Graph: ',tmpD3Graph);

            

            const queryTxt = `
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#> 
            PREFIX sosa: <http://www.w3.org/ns/sosa/> 
            PREFIX ucmm: <http://purl.org/ucmm#> 
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
            PREFIX dcat: <http://www.w3.org/ns/dcat#> 
            PREFIX dcterms: <http://purl.org/dc/terms/> 
            SELECT DISTINCT ?obsColl ?obsCollProp ?skosConcept ?litMentioningSearchLabel ?dataset
            WHERE{
                BIND( <${datasetUri}> as ?dataset )
                {
                    ?obsColl rdf:type sosa:ObservationCollection .
                    ?obsColl ucmm:hasAggregatedResult ?dataset .
                    ?obsColl  ?obsCollProp ?skosConcept. 
                    ?skosConcept skos:prefLabel ?litMentioningSearchLabel . 
                    
                }UNION{
                    ?obsCollParent ucmm:hasAggregatedResult ?dataset .
                    ?obsCollParent rdf:type sosa:ObservationCollection .
                    ?obsCollParent sosa:hasMember ?obsColl .
                    ?obsColl  ?obsCollProp ?skosConcept.
                    ?skosConcept skos:prefLabel ?litMentioningSearchLabel . 
                    
                }UNION{
                    ?obsCollGrandParent ucmm:hasAggregatedResult ?dataset .
                    ?obsCollGrandParent rdf:type sosa:ObservationCollection .
                    ?obsCollGrandParent sosa:hasMember ?obsCollParent .
                    ?obsCollParent sosa:hasMember ?obsColl.
                    ?obsColl  ?obsCollProp ?skosConcept.
                    ?skosConcept skos:prefLabel ?litMentioningSearchLabel . 
                }
                
                FILTER ( 
                regex(?litMentioningSearchLabel,"${termInfo.term}","i") 
                )
                FILTER (
                    lang(?litMentioningSearchLabel)="en"
                )
            }
            `.replace('\n',' ')

            console.log(' queryTxt:', queryTxt);

            const response = await fetch(kbUri,{
                method: "POST",
               // credentials: "include", // localhost only
                headers:{
                    "Content-Type": 'application/x-www-form-urlencoded',
                    "Accept" : "application/json",
                },
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

                            for (let index = 0;  index< jsonData.results.bindings.length; index++) {
                                const binding = jsonData.results.bindings[index];
                                
                                if( binding['dataset'] !== datasetUri){

                                }
                                // ?obsColl ?obsCollProp ?skosConcept ?litMentioningSearchLabel ?dataset

                                const obsColl = binding['obsColl']['value'];
                                const obsCollNodeId =  getLocalUri(obsColl);
                                // console.log('obsCollNodeId',obsCollNodeId)
                                if(!containId(tmpD3Graph.nodes,obsCollNodeId)){
                                    tmpD3Graph.nodes.push({
                                        id: obsCollNodeId,
                                        group: getGroupFromPrefixedUri(obsCollNodeId),
                                        nodeInfo:obsColl,
                                        nodeLabel: obsCollNodeId,
                                        nodeType: 'resource', // literal, resource, property, 
                                        nodeUri:obsColl
                                    });
                                }


                                // console.log('obsCollProp',obsCollProp)
                                const obsCollProp = binding['obsCollProp']['value'];
                                const obsCollPropId = `nodeIdx_${tmpD3Graph.nodes.length}`;
                                // console.log('obsCollPropId',obsCollPropID)
                                tmpD3Graph.nodes.push({
                                    id: obsCollPropId,
                                    group: getGroupFromPrefixedUri(obsCollProp),
                                    nodeInfo: obsCollProp,
                                    nodeLabel: getLocalUri(obsCollProp),
                                    nodeType: 'property' // literal, resource, property, 
                                });


                                const conceptLabel= binding['litMentioningSearchLabel']['value'];
                                const conceptId = getLocalUri(binding['skosConcept']['value']);
                                console.log('conceptId',conceptId)
                                tmpD3Graph.nodes.push({
                                    id: conceptId,
                                    group: getGroupFromPrefixedUri(conceptId),
                                    nodeInfo: `${binding['skosConcept']['value']} :\n  ${conceptLabel}`,
                                    nodeLabel: conceptId,
                                    nodeType: 'resource' // literal, resource, property, 
                                });
  


                                const searchTermRelationId = `nodeIdx_${tmpD3Graph.nodes.length}`;
                                tmpD3Graph.nodes.push({
                                    id: searchTermRelationId,
                                    group: 4,
                                    nodeInfo: 'in',
                                    nodeLabel: ":in",
                                    nodeType: 'property' // literal, resource, property, 
                                });

                                
                                // search label to conceptId

                                tmpD3Graph.links.push({
                                    source: tmpD3Graph.nodes[0].id,
                                    target: searchTermRelationId,
                                    value: 1
                                });


                                tmpD3Graph.links.push({
                                    source: searchTermRelationId,
                                    target: conceptId,
                                    value: 1
                                });

                                   
                                
                                // ObsColl to conceptId

                                tmpD3Graph.links.push({
                                    source: obsCollNodeId,
                                    target: obsCollPropId,
                                    value: 1
                                });

                                tmpD3Graph.links.push({
                                    source: obsCollPropId,
                                    target: conceptId,
                                    value: 1
                                });

                                    

                                const dataset = binding['dataset']['value'];
                                console.log('dataset: ',dataset);
                                const datasetNodeId =  getLocalUri(dataset);
                                // console.log('datasetNodeId',datasetNodeId)
                                if(!containId(tmpD3Graph.nodes,datasetNodeId)){
                                    tmpD3Graph.nodes.push({
                                        id: datasetNodeId,
                                        group: getGroupFromPrefixedUri(datasetNodeId),
                                        nodeInfo:dataset,
                                        nodeLabel: datasetNodeId,
                                        nodeType: 'resource', // literal, resource, property, 
                                        nodeUri:dataset
                                    });
                                }

                                const obsCollDatasetProp = getLocalUri("http://purl.org/ucmm#hasAggregatedResult");
                                // console.log('datasetProp',datasetProp)
                                const obsCollDatasetPropId = `nodeIdx_${tmpD3Graph.nodes.length}`;
                                // console.log('datasetPropId',datasetPropId)
                                tmpD3Graph.nodes.push({
                                    id: obsCollDatasetPropId,
                                    group: getGroupFromPrefixedUri(obsCollDatasetProp),
                                    nodeInfo: "http://purl.org/ucmm#hasAggregatedResult",
                                    nodeLabel: obsCollDatasetProp,
                                    nodeType: 'property' // literal, resource, property, 
                                });

                                
                                // ObsColl to Dataset

                                tmpD3Graph.links.push({
                                    source: obsCollNodeId,
                                    target: obsCollDatasetPropId,
                                    value: 1
                                });

                                tmpD3Graph.links.push({
                                    source: obsCollDatasetPropId,
                                    target: datasetNodeId,
                                    value: 1
                                });

                                    


                                
   
                            }
                        }
                    }
                }

            }

            console.log('tmpD3Graph:', tmpD3Graph);
           resolve(true);
             
        } catch (error) {
            console.error('Error:', error);
            resolve(false);
        }
        })
    }
   
    async function explainDatasetToTermRelationship(tmpD3Graph){

        let updatedExplanation = true;
        updatedExplanation &&= await explainDatasetFromDescriptionTitleKeyword(tmpD3Graph);
        updatedExplanation &&= await explainDatasetFromSubjects(tmpD3Graph);
        updatedExplanation &&= await explainDatasetFrom3LevelsObsColParams(tmpD3Graph);

        setD3Graph(tmpD3Graph);
        setCurrentlyExplainedTerm(termInfo.term);
        setCurrentlyExplainedDataset(datasetUri);

        return updatedExplanation;
    }

    useEffect(  function () {

            
            if(termInfo.term === '' || datasetUri==='' ){
                return;
            }
            
            console.log(`useEffect DatasetExplainedGraph`)
            console.log(` termInfo.term`,termInfo.term)
            console.log(` currentExlainedTerm`, currentlyExplainedTerm )
            console.log(` currentlyVisualisedTerm`, currentlyVisualisedTerm )
            console.log(` currentlyExplainedDataset`, currentlyExplainedDataset)
            console.log(` currentlyVisualisedDataset`, currentlyVisualisedDataset)

            console.log(` d3Graph`,d3Graph)


            if(d3Graph.nodes.length===0 || termInfo.term != currentlyExplainedTerm || datasetUri != currentlyExplainedDataset){

                console.log(`  initialise tmpD3Graph `);

                const tmpD3Graph = {
                    nodes:[
                        {
                            id:'nodeIdx_0',
                            group:4,
                            nodeInfo:'Search term: '+termInfo.term,
                            nodeLabel: termInfo.term,
                            nodeType: 'literal' // literal, resource, property, 
                        }
                    ],
                    links:[
                        // {
                        //     source: String,
                        //     target: String,
                        //     value: Int16Array  // default 1
                        //     linkType : String  // in, out
                        // }
                    ]
                };
                
                // TODO Remove
                // let updatedExplanation = false;
                // explainDatasetsFromDescAndTitle(tmpD3Graph).then( (explanationReceived) =>{
                    
                //     updatedExplanation ||=  explanationReceived;

                //     if(updatedExplanation){
                //         setD3Graph(tmpD3Graph);
                //         setCurrentlyExplainedTerm(termInfo.term);
                //     }


                //     console.log(` updatedExplanation: ${updatedExplanation}`)
                // })

                explainDatasetToTermRelationship(tmpD3Graph);

                // NOTE that since explainDatasetsFromDescAndTitle is asynchonous the main process may return before reaching the end of explainDatasetsFromDescAndTitle
                if(currentlyVisualisedTerm!==''){
                    if(d3.selectAll('g')){
                        d3.selectAll('g').remove();
                        console.log(`  d3.selectAll('g').remove()`);
                    }
                }

                return;

            }
            
            if(d3Graph.nodes.length>0 && 
                (currentlyVisualisedTerm==='' 
                    || currentlyExplainedTerm !== currentlyVisualisedTerm 
                    || currentlyExplainedDataset !== currentlyVisualisedDataset
                )){

                console.log(` draw d3Graph `,d3Graph);

                 // Specify the color scale. or schemePaired for 12 colors
                const color = d3.scaleOrdinal(d3.schemeCategory10);

                // The force simulation mutates links and nodes, so create a copy
                // so that re-evaluating this cell produces the same result.
                const links = d3Graph.links.map(d => (Object.create(d)));
                const nodes = d3Graph.nodes.map(d => (Object.create(d)));

                
                
                // Create a simulation with several forces.
                const simulation = d3.forceSimulation(nodes)
                    .force("link", d3.forceLink(links).id(d => d.id))
                    .force("charge", d3.forceManyBody())
                    .force("center", d3.forceCenter(width / 2, height / 2))
                    // .force("collide", d3.forceCollide().radius(30).strength(1) ) // distance between node
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
                    .selectAll("line")
                    .data(links)
                    .join("line")
                    .attr("stroke-width", d => Math.sqrt(d.value));

                const node = svg.append("g")
                    // .attr("stroke", "#000" ) // defined within  circle
                    // .attr("stroke-width", 4)  // defined within circle
                    .selectAll(".node")
                    .data(nodes)
                    .join("g")
                    .attr('class', 'node');
                
                node.append("circle")
                    .attr("r", d => d.nodeType.includes('property')?3:10 )
                    .attr("fill", d => color(d.group))
                    // .attr("stroke", "#000" )
                    // .attr("stroke-width", 4) 
                    .attr("stroke", function (d){return (d.id.endsWith('dataset') )?"#000":"#fff" ;})
                    .attr("stroke-width", function (d){return (d.id.endsWith('dataset') )?3:1.5;})  // d.nodeUri.include

                // Add a drag behavior.
                node.call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));


                node.append("title")
                    .text(function(d){ return d.nodeInfo ;})
                    .style('font-family', 'sans-serif')
                    .style('font-size', '10px')
                    .attr('x', 11)
                    .attr('y', 3);

                node.append("text")
                    .text(d => d.nodeLabel)
                    // .style('fill', '#000')
                    .style('stroke', 'Blue') // #000
                    .style('stroke-width', 0.1)
                    .style('font-family', 'sans-serif')
                    .style('font-size', '13px')
                    .attr("text-anchor","start")
                    .attr('x', 11)
                    .attr('y', 3)
                ;

                // simulation
                //     .nodes(nodes)
                //     .on("tick", ticked);
              
                // simulation.force("link")
                //     .links(links);
                   

                

                // Set the position attributes of links and nodes each time the simulation ticks.
                function ticked() {
                    link
                        .attr("x1", d => d.source.x) // DatasetDiscoveryExplainedSVGGraph.js:364 Uncaught TypeError: Cannot read properties of undefined (reading 'attr')
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);

                    // node.attr("cx", d => d.x)
                    //     .attr("cy", d => d.y);
                    node.attr("transform", function(d) {
                            return "translate(" + d.x + "," + d.y + ")";
                          });
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
                setCurrentlyVisualisedDataset(currentlyExplainedDataset);

            }

        }, [datasetUri,termInfo, d3Graph] // nodes, links
    );

    return(
        <div style={{overflow:"scroll", height:"600px", width:"800px"}}>
            {datasetUri!=='' && d3Graph.nodes.length>0?(
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