import * as d3 from 'd3';
import { useEffect, useState, useRef } from "react";
import { RADIUS, drawNetwork } from './drawNetwork';
import React from 'react';
import ForceUndirectedD3Graph from './ForceUndirectedD3Graph';
import { getLocalUri, getGroupFromProvService, getMetaDataId, getGroupFromPrefixedUri, getGroupColor } from '../util/prefix_util';
import { Card, Table } from 'react-bootstrap';




export default function DatasetExplainedGraph ({kbUri, datasetUri, termInfo, width, height}){

    const svgRef  = useRef();

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
        for(let node of nodes){
            if( node.id == searchId){
                return true;
               }
        }
        return false;
    }

    function getNodeById(nodes,nodeId){
        // console.log(`getNodeById`);
        // console.log(' nodes: ',nodes);
        // console.log(' nodeId: ',nodeId);

        let foundNode =null;
        for(let node of nodes){
            if( node.id == nodeId){
                foundNode = node;
            }
        }
        // console.log(' return: ',foundNode);
        return foundNode;

    }

    function getPretyLabel(label){
        if(label){
            return label.length<14?label:label.slice(0,14)+'...';
        }else{
            return '';
        }
    }
  
    async function explainDatasetFromDescriptionTitleKeyword (tmpD3Graph) {
        
        return new Promise (async (resolve,reject) => {

        try {  

            if(!termInfo.term){
                resolve(false);
            }

            console.log('explainDatasetFromDescriptionTitleKeyword()')
            console.log(' kbUri : ',kbUri);
            console.log(` datasetUri: ${datasetUri} `)
            console.log(' termInfo.term : ',termInfo.term);
            console.log(' tmpD3Graph: ',tmpD3Graph);

            

            const queryTxt = `
            PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            PREFIX sosa: <http://www.w3.org/ns/sosa/>
            PREFIX ucmm: <http://purl.org/ucmm#> 
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
            PREFIX dcat: <http://www.w3.org/ns/dcat#> 
            PREFIX dcterms: <http://purl.org/dc/terms/>
            PREFIX prov: <http://www.w3.org/ns/prov#>

            SELECT DISTINCT ?datasetProp ?datasetPropVal
            WHERE{
                {
                    VALUES ?datasetProp {dcterms:description dcterms:title dcat:keyword }
                    <${datasetUri}> rdf:type dcat:Dataset ;
                        ?datasetProp ?datasetPropVal.
                    FILTER ( 
                        regex(?datasetPropVal,"${termInfo.term}","i") 
                    )
                    FILTER (
                        lang(?datasetPropVal)="en"
                    )
                }UNION{
                    VALUES ?datasetProp {dcterms:subject }
                    <${datasetUri}> rdf:type dcat:Dataset ;
                        ?datasetProp ?conceptMentioningSearchLabel. 
                    ?conceptMentioningSearchLabel skos:prefLabel ?datasetPropVal.

                    FILTER ( 
                        regex(?datasetPropVal,"${termInfo.term}","i") 
                    )
                    FILTER (
                        lang(?datasetPropVal)="en"
                    )
                }UNION{
                    VALUES ?datasetProp { prov:wasGeneratedBy}
                    <${datasetUri}> rdf:type dcat:Dataset ;
                        (dcterms:description|dcterms:title|dcat:keyword) ?litMentioningTerm ;
                        ?datasetProp ?datasetPropVal.
                    FILTER ( 
                        regex(?litMentioningTerm,"${termInfo.term}","i") 
                    )
                    FILTER (
                        lang(?litMentioningTerm)="en"
                    )
                }
            }
            `.replace('\n',' ')

            // console.log(' queryTxt:', queryTxt);


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
            
            const prop2uri = {
                hasTitle : '',
                hasDescription : '',
                hasKeyword : '',
                hasProvenance : ''
            }

            const prop2vals = {
                hasTitle : [],
                hasDescription : [],
                hasKeyword : [],
                hasProvenance : []
            }

            if(jsonData){

                if(jsonData.results){
                    if(jsonData.results.bindings){
                        if(jsonData.results.bindings.length>0){

                            jsonData.results.bindings.forEach( binding =>{
                                
                                const propUri = binding['datasetProp']['value']
                                const propVal = binding['datasetPropVal']['value'];
                                if(propVal){
                                    switch(propUri){
                                        case 'http://www.w3.org/ns/prov#wasGeneratedBy' : 
                                            { prop2uri.hasProvenance = propUri;
                                            prop2vals.hasProvenance.push(propVal);
                                            break;
                                            }
                                        case 'http://purl.org/dc/terms/description' : 
                                            { prop2uri.hasDescription = propUri;
                                                if( prop2vals.hasDescription.length==0){
                                                    prop2vals.hasDescription.push(propVal)
                                                }else{
                                                    console.log( `WARNING  has 2 Descriptions `)
                                                }
                                                break;
                                            }
                                        case 'http://purl.org/dc/terms/title' : 
                                            { prop2uri.hasTitle = propUri;
                                                if( prop2vals.hasTitle.length==0){
                                                    prop2vals.hasTitle.push(propVal)
                                                }else{
                                                    console.log(`WARNING ${datasetUri} has 2 Titles`)
                                                }
                                                break;
                                            }
                                        case 'http://www.w3.org/ns/dcat#keyword' :
                                                {   prop2uri.hasKeyword = propUri;

                                                    if(prop2vals.hasKeyword.indexOf(propVal)==-1){ // record the set of keywords
                                                        prop2vals.hasKeyword.push(propVal.toLowerCase())
                                                    }
                                                    break;
                                                }
                                    }
                                }

                            })
                        }
                    }
                }
            }

            console.log(" prop2vals: ",prop2vals)

            const datasetNodeId =  getMetaDataId(datasetUri);
            
            if(!containId(tmpD3Graph.nodes,datasetNodeId)){
                tmpD3Graph.nodes.push({
                    id: datasetNodeId,
                    group: getGroupFromProvService(prop2vals.hasProvenance),
                    nodeInfo: datasetUri,
                    nodeLabel: datasetNodeId,
                    nodeType: 'resource', // literal, resource, property, 
                    nodeUri: datasetUri
                });

            }
            
            

            for (let propKey of Object.getOwnPropertyNames(prop2vals)){

                if(propKey == 'hasProvenance' || prop2vals[propKey].length == 0){
                    continue
                }

                console.log(" adding to graph: "+propKey);

                const datasetPropId = propKey;
                tmpD3Graph.nodes.push({
                    id: datasetPropId,
                    group: 6,
                    nodeInfo: prop2uri[propKey],
                    nodeLabel: propKey,
                    nodeType: 'property' // literal, resource, property, 
                });

                // Dataset to datasetProp

                tmpD3Graph.links.push({
                    source: datasetNodeId,
                    target: datasetPropId,
                    value: 1
                });

                

                for(let propVal of  prop2vals[propKey] ){

                    const propValId = "propValId_"+tmpD3Graph.nodes.length;


                    tmpD3Graph.nodes.push({
                        id: propValId,
                        group: getGroupFromProvService(prop2vals.hasProvenance),
                        nodeInfo: propVal,
                        nodeLabel: getPretyLabel(propVal),
                        nodeType: 'literal' // literal, resource, property, 
                    });

                    // DatasetProp to propVal
    
                    tmpD3Graph.links.push({
                        source: datasetPropId,
                        target: propValId,
                        value: 1
                    });



                    // search label to propVal
                    const inRelId ='in';

                    if(!containId(tmpD3Graph.nodes,inRelId)){
                        tmpD3Graph.nodes.push({
                            id: inRelId,
                            group: 6,
                            nodeInfo: 'http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#subString',
                            nodeLabel: "isIn",
                            nodeType: 'property' // literal, resource, property, 
                        });
                    }

                    tmpD3Graph.links.push({
                        source: tmpD3Graph.nodes[0].id,
                        target: inRelId,
                        value: 1
                    });

                    tmpD3Graph.links.push({
                        source: inRelId,
                        target: propValId,
                        value: 1
                    });

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
        
        // return new Promise (async (resolve,reject) => {

        try {  

            if(!termInfo.term){
                // resolve(false);
                return false;
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
            PREFIX prov: <http://www.w3.org/ns/prov#>


            SELECT DISTINCT  ?subjectUri ?subjectVal ?serviceCall
            WHERE{
                <${datasetUri}> rdf:type dcat:Dataset ;
                    dcterms:subject ?subjectUri. 
                ?subjectUri skos:prefLabel ?subjectVal.
                <${datasetUri}> prov:wasGeneratedBy ?serviceCall.
                FILTER ( 
                    regex(?subjectVal,"${termInfo.term}","i") 
                )
                FILTER (
                    lang(?subjectVal)="en"
                )
            }
            `.replace('\n',' ')

            // console.log(queryTxt);

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

            const datasetResource = {
                hasSubject : [],   // array of String
                hasSubjectUri :[], // array of array of String
                hasProvenance : [] // array od String
            }

            if(jsonData){

                if(jsonData.results){
                    if(jsonData.results.bindings){
                        if(jsonData.results.bindings.length>0){

                            jsonData.results.bindings.forEach( binding =>{
                                
                                const datasetProvenance = binding['serviceCall']['value'];
                                if(datasetProvenance){
                                    if(datasetResource.hasProvenance.indexOf(datasetProvenance)==-1){
                                        datasetResource.hasProvenance.push(datasetProvenance);
                                    }
                                }

                                const subjectUri = binding['subjectUri']['value']
                                const subjectVal = binding['subjectVal']['value']?  binding['subjectVal']['value'].toLowerCase(): binding['subjectVal']['value'];

                                if(subjectVal){
                                    const idxSubjectVal = datasetResource.hasSubject.indexOf(subjectVal);
                                    if(idxSubjectVal==-1){
                                        datasetResource.hasSubject.push(subjectVal);
                                        datasetResource.hasSubjectUri.push([subjectUri]);
                                    }else{
                                        if(datasetResource.hasSubjectUri[idxSubjectVal].indexOf(subjectUri)==-1){
                                            datasetResource.hasSubjectUri[idxSubjectVal].push([subjectUri])
                                        }
                                    }
                                }
                               
                            })
                        }
                    }
                }
            }

            console.log(" datasetResource: "+datasetResource)

            const datasetNodeId =  getMetaDataId(datasetUri);
            if(!containId(tmpD3Graph.nodes,datasetNodeId)){
                tmpD3Graph.nodes.push({
                    id: datasetNodeId,
                    group: getGroupFromProvService(datasetResource.hasProvenance),
                    nodeInfo: datasetUri,
                    nodeLabel: 'Dataset: '+datasetNodeId,
                    nodeType: 'resource', // literal, resource, property, 
                    nodeUri: datasetUri
                });

            }

            if(datasetResource.hasSubject.length>0){

            // Dataset to hasSubject property
            
            const hasSubjectNodeId = "hasSubject";
            tmpD3Graph.nodes.push({
                id: hasSubjectNodeId,
                group: getGroupFromProvService(datasetResource.hasProvenance),
                nodeInfo: 'http://purl.org/dc/terms/subject',
                nodeLabel: hasSubjectNodeId,
                nodeType: 'property', // literal, resource, property, 
                nodeUri: 'http://purl.org/dc/terms/subject'
            });

            tmpD3Graph.links.push({
                source: datasetNodeId,
                target: hasSubjectNodeId,
                value: 1
            });


                for(let i=0;i<datasetResource.hasSubject.length;i++){
                    const subjectVal = datasetResource.hasSubject[i];
                    const subjectUrisText = datasetResource.hasSubjectUri[i].reduce((acc,v) => acc+' '+v,'');

                    console.log(" adding subject to graph: "+subjectVal);

                    // hasSubject property to subjectVal

                    const subjectValId = 'subject_'+i;
                    tmpD3Graph.nodes.push({
                        id: subjectValId,
                        group: getGroupFromProvService(datasetResource.hasProvenance),
                        nodeInfo: subjectUrisText,
                        nodeLabel: subjectVal,
                        nodeType: 'literal' // literal, resource, property, 
                    });

                    tmpD3Graph.links.push({
                        source: hasSubjectNodeId,
                        target: subjectValId,
                        value: 1
                    });

                    // search label to subjectVal

                    const inRelId = `in`;
                    if(!containId(tmpD3Graph.nodes,inRelId)){
                        tmpD3Graph.nodes.push({
                            id: inRelId,
                            group: 4,
                            nodeInfo: 'http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#subString',
                            nodeLabel: "in",
                            nodeType: 'property' // literal, resource, property, 
                        });
                    }

                    tmpD3Graph.links.push({
                        source: tmpD3Graph.nodes[0].id,
                        target: inRelId,
                        value: 1
                    });

                    tmpD3Graph.links.push({
                        source: inRelId,
                        target: subjectValId,
                        value: 1
                    });

                }
            }

            
            console.log('tmpD3Graph:', tmpD3Graph);
           return(true);
             
        } catch (error) {
            console.log('Error:', error);
            return(false);
        }
        // })
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
        // updatedExplanation &&= await explainDatasetFromSubjects(tmpD3Graph);
        // updatedExplanation &&= await explainDatasetFrom3LevelsObsColParams(tmpD3Graph);

        setD3Graph(tmpD3Graph);
        setCurrentlyExplainedTerm(termInfo.term);
        setCurrentlyExplainedDataset(datasetUri);

        return updatedExplanation;
    }



    useEffect(  
        function () {

            
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
                            group:6,
                            nodeInfo:'Search term: '+termInfo.term,
                            nodeLabel: 'Search: '+termInfo.term,
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
                


                // dataset Uri example for 'water temperature': 
                //    http://example.org/3df904de-e47d-4bf9-85a0-7c0942aff8b6#dataset , ODATIS

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

                
                // Create the SVG container.
                const svg = d3.select(svgRef.current)
                    .attr("width", width)
                    .attr("height", height-50)
                    // .attr("viewBox", [0, 0, width, height])
                    // .attr("style", "max-width: 100%; height: auto; font: 12px")
                ;

                // The force simulation mutates links and nodes, so create a copy
                // so that re-evaluating this cell produces the same result.

                const edges = []
                const arcs = []
                d3Graph.links.forEach( l => {
                        const targetNode = getNodeById(d3Graph.nodes, l.target);
                        if(targetNode.nodeType=='property'){
                            edges.push(Object.create(l))
                        }else{
                            arcs.push(Object.create(l))
                        }
                    })

                console.log('edges ',edges)

                console.log('arcs ',arcs)

                // const links = d3Graph.links.map(d => (Object.create(d)));
                const links  = [];
                edges.forEach( l => links.push(l))
                arcs.forEach( l => links.push(l))

  


                const nodes = d3Graph.nodes.map(d => (Object.create(d)));

                console.log('links ',links)

                const types = Array.from(new Set(links.map(d => d.group)));

                // Specify the color scale. or schemePaired for 12 colors
                // const color = d3.scaleOrdinal(types,d3.schemeCategory10);
                
                
                // Create a simulation with several forces.
                const simulation = d3.forceSimulation(nodes)
                    .force("link", d3.forceLink(links).id(d => d.id))
                    // .force("link", d3.forceLink(edges).id(d => d.id))
                    // .force("link", d3.forceLink(arcs).id(d => d.id))

                    .force("charge", d3.forceManyBody().strength(-400))
                    .force("center", d3.forceCenter(width / 2, height / 2))
                    .force("collide", d3.forceCollide().radius(30).strength(1) ) // distance between node
                    .on("tick", ticked);

                


                // Add a line for each link, and a circle for each node.

                svg.append("defs").append("marker")
                // .data(types)
                // .join("marker")
                //   .attr("id", d => `arrow-${d}`)
                  .attr("id",  `arrow`)
                  .attr("viewBox", "0 -5 10 10")
                  .attr("refX", 15)
                  .attr("refY", -0.5)
                  .attr("markerWidth", 6)
                  .attr("markerHeight", 6)
                  .attr("orient", "auto")
                 .append("path")
                  .attr("fill", "black")
                  .attr("d", "M0,-5L10,0L0,5")
                //   .attr("d", "M 0 -5 10 10")
                //   .attr("d", "M 0 0 12 6 0 12 3 6")

                // const link = svg.append("g")
                //   .attr("fill", "none")
                //  .selectAll("line")
                //   .data(links)
                //  .join("line")
                // //   .attr("stroke", d => color(d.value))
                //   .attr("stroke", 'black')
                //   .attr("stroke-width", 1.5)
                //   .attr("marker-end",'url(#arrow)')

                const arc = svg.append("g")
                  .attr("fill", "none")
                 .selectAll("path") // line: straigth link , path: curved link
                  .data(arcs)
                 .join("path")
                //   .attr("stroke", d => color(d.value))
                  .attr("stroke", 'black')
                  .attr("stroke-width", 1.5)
                  .attr("marker-end",'url(#arrow)')


                const edge = svg.append("g")
                .attr("fill", "none")
               .selectAll("path") // "line": straigth link , "path": curved link
                .data(edges)
               .join("path")
              //   .attr("stroke", d => color(d.value))
                .attr("stroke", 'black')
                .attr("stroke-width", 1.5)

                

                // Add a circle for each node.
                const node = svg.append("g")
                    // .attr("stroke", "#000" ) // defined within  circle
                    // .attr("stroke-width", 4)  // defined within circle
                    .selectAll("circle")
                    .data(nodes)
                    .join("g")
                    .attr('class', 'node');
                
                node.append("circle")
                    .attr("r", d => d.nodeType.includes('property')?3:7 )
                    .attr("fill", d => getGroupColor(d.group))
                    // .attr("stroke", "#000" )
                    // .attr("stroke-width", 4) 
                    .attr("stroke", function (d){return (d.nodeInfo.endsWith('#dataset') )?"black":getGroupColor(d.group) ;})
                    .attr("stroke-width", function (d){return (d.nodeInfo.endsWith('#dataset') )?4:2;})  // d.nodeUri.include

                // Add a drag behavior.
                node.call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));


                node.append("title")
                    .text(function(d){ return d.nodeInfo ;})
                    .style('font-family', 'sans-serif')
                    .style('font-size', '12px')
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

                    // linkArc
                    // link.attr("d", function(d){
                    //     const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
                    //     return `
                    //         M${d.source.x},${d.source.y}
                    //         A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
                    //     `;
                    // });
                    
                    
                    // link.attr("x1", d => d.source.x) 
                    //     .attr("y1", d => d.source.y)
                    //     .attr("x2", d => d.target.x)
                    //     .attr("y2", d => d.target.y);



                    // arc.attr("x1", d => d.source.x) 
                    //     .attr("y1", d => d.source.y)
                    //     .attr("x2", d => d.target.x)
                    //     .attr("y2", d => d.target.y);

                    arc.attr("d", function(d){
                        const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
                        return `
                            M${d.source.x},${d.source.y}
                            A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
                        `;
                        
                        // alternative

                        // const dx = d.target.x - d.source.x;
                        // const dy = d.target.y - d.source.y;
                        // const dr = Math.sqrt(dx * dx + dy * dy);
                        // return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;

                    });
                    
                    
                    
                    // edge.attr("x1", d => d.source.x) 
                    //     .attr("y1", d => d.source.y)
                    //     .attr("x2", d => d.target.x)
                    //     .attr("y2", d => d.target.y);

                    // edge.attr("d", function(d){
                    //     const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
                    //     return `
                    //         M${d.source.x},${d.source.y}
                    //         A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
                    //     `;
                        
                        
                    // });

                    // Inverse source and target while drawing to have an inversed curved w.r.t arc curve
                    edge.attr("d", function(d){
                        const r = Math.hypot(d.source.x - d.target.x, d.source.y - d.target.y);
                        return `
                            M${d.target.x},${d.target.y}
                            A${r},${r} 0 0,1 ${d.source.x},${d.source.y}
                        `;
                        
                        
                    });
                    




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
        <Card style={{ width:'100%', height}}>
        <Card.Header>
                Explanatory Graph 
        </Card.Header>
       
            {datasetUri!='' && d3Graph.nodes.length>0?(

                <div style={{ overflow:'scroll', textAlign:'center'}}>
                    <Card.Body>

                        <div style={{fontSize:'16px'}}> Semantic relations between the user query and the retrieved dataset</div>

                        <svg 
                            ref={svgRef}
                        />

                        <Table >

                        <tr>
                            <td colSpan={5} style={{fontSize:'15px', textAlign:'center'}}> (Pass over a node or link for details)</td>
                        </tr>

                        <tr>
                            <td>
                                <ul  style={{ listStyleType:'square', fontSize:'30px', color:'#3Cf'}}>
                                    <li>
                                        <span style={{fontSize:'15px', color:'black'}}>AERIS</span>
                                    </li>
                                </ul>
                            </td>
                            <td>
                                <ul  style={{ listStyleType:'square', fontSize:'30px', color:'#c30'}}>
                                    <li>
                                        <span style={{fontSize:'15px', color:'black'}}>FORMATER</span>
                                    </li>
                                </ul>
                            </td>
                            <td>
                                <ul  style={{ listStyleType:'square', fontSize:'30px', color:'#f00'}}>
                                    <li>
                                        <span style={{fontSize:'15px', color:'black'}}>THEIA-OZCAR  </span>
                                    </li>
                                </ul>
                            </td>
                            <td>
                                <ul  style={{ listStyleType:'square', fontSize:'30px', color:'#36C'}}>
                                    <li>
                                        <span style={{fontSize:'15px', color:'black'}}>THEIA-HYDRO</span>
                                    </li>
                                </ul>
                            </td>
                            <td>
                                <ul  style={{ listStyleType:'square', fontSize:'30px', color:'#039'}}>
                                    <li>
                                        <span style={{fontSize:'15px', color:'black'}}>ODATIS</span>
                                    </li>
                                </ul>
                            </td>

                        </tr>

                        </Table>

                    
                        
                    
                        
                    </Card.Body>
                </div>
            ):(
                <Card.Body>
                    {datasetUri =='' ?(
                        <p>   
                            Welcome to the multisource Earth System Dataset Discovery:
                            <ol>
                                <li> Please enter a search term (top left) </li>
                                <li> (Optional) Enable open link discovery (left)</li>
                                <li> Click on 'Retrieve Datasets' (top left) </li>
                                <li> Click on a retrieved metadata title (below) </li>
                            </ol>

                        </p>
                    ):(
                        <> Oups, no explanation to draw </>
                    )
                    
                    }
                </Card.Body>
            )}
            
        
        </Card>
    )
}