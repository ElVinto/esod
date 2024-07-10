import { useEffect, useState } from "react";
import { Card, Row,Col } from "react-bootstrap";
import Container from 'react-bootstrap/Container';


import LinkedSearchDatasetVarTable from './bindingVarTable/LinkedSearchDatasetVarTable';

export default function LinkedSearchVarTableList ({ linkedConceptMap, kbUri, setDatasetUriCallBack}){


    const [linkedSearchPathMap,setLinkedSearchPathMap] = useState(new Object());


    // const [labelledInverseArcStructure,setLabelledInverseArcStructure] = useState(new Map());

    
    const [targetPropCategorySourceLabelMap, setTargetPropCategorySourceLabelMap]= useState(new Object());



    useEffect(
        

        ()=>{

            console.log("useEffect LinkedSearchDatasetVarTable")

            const lSPM = new Object();
            Object.entries(linkedConceptMap).forEach(([endpointKey, propCategories])=>{
                Object.entries(propCategories).forEach(([propCategory, tripleInfo])=>{
                    if(Object.hasOwn(tripleInfo,'targetLabels' )){
                        tripleInfo.targetLabels.forEach( targetLabel=>{
                            
                            if(!Object.hasOwn(lSPM,targetLabel)){
                                lSPM[targetLabel] ={
                                        targetUris: tripleInfo.targetUris,
                                        propCategories:(new Array(tripleInfo.propertyUris.length)).fill(propCategory),
                                        propertyUris:tripleInfo.propertyUris,
                                        sourceUris: tripleInfo.sourceUris,
                                        sourceLabels: tripleInfo.sourceLabels,
                                        endpointKeys: (new Array(tripleInfo.propertyUris.length)).fill(endpointKey),
                                        endpointUris: (new Array(tripleInfo.propertyUris.length)).fill(tripleInfo.endpointUri) 
                                    }
                            }else{
                                 
                                lSPM[targetLabel]={
                                        ...lSPM[targetLabel],
                                        targetUris: lSPM[targetLabel].targetUris.concat(tripleInfo.targetUris),
                                        propCategories: lSPM[targetLabel].propCategories.concat(new Array(tripleInfo.propertyUris.length).fill(propCategory)),
                                        propertyUris:  lSPM[targetLabel].propertyUris.concat(tripleInfo.propertyUris),
                                        sourceLabels: lSPM[targetLabel].sourceLabels.concat(tripleInfo.sourceLabels),
                                        sourceUris: lSPM[targetLabel].sourceUris.concat(tripleInfo.sourceUris),
                                        endpointKeys: lSPM[targetLabel].endpointKeys.concat((new Array(tripleInfo.propertyUris.length)).fill(endpointKey)),
                                        endpointUris: lSPM[targetLabel].endpointUris.concat((new Array(tripleInfo.propertyUris.length)).fill(tripleInfo.endpointUri)),
                                    }
                            }
                        })
                    }
                })
            })

            console.log(' lSPM: ',lSPM);

            setLinkedSearchPathMap(lSPM);


            const tPCSLM = {};

            Object.entries(linkedConceptMap).forEach(([endpointKey, propCategories])=>{
                Object.entries(propCategories).forEach(([propCategory, tripleInfo])=>{
                    if(Object.hasOwn(tripleInfo,'targetLabels' )){
                        

                        for(let i=0;i<tripleInfo.targetLabels.length;i++){
                            const targetLabel = tripleInfo.targetLabels[i];
                            const sourceLabel = tripleInfo.sourceLabels[i];
                            
                            if(!tPCSLM.hasOwnProperty(targetLabel)){
                                tPCSLM[targetLabel]= {};
                            }
                            if(!tPCSLM[targetLabel].hasOwnProperty(propCategory) ){
                                tPCSLM[targetLabel][propCategory]= {};
                            }
                            if(!tPCSLM[targetLabel][propCategory].hasOwnProperty(sourceLabel) ){
                                tPCSLM[targetLabel][propCategory][sourceLabel]= new Object();
                                tPCSLM[targetLabel][propCategory][sourceLabel]['sourceUris'] =new Array();
                                tPCSLM[targetLabel][propCategory][sourceLabel]['propertyUris'] = new Array();
                                tPCSLM[targetLabel][propCategory][sourceLabel]['targetUris'] = new Array();
                                tPCSLM[targetLabel][propCategory][sourceLabel]['endpointUris']= new Array();
                                tPCSLM[targetLabel][propCategory][sourceLabel]['endpointKeys']= new Array();

                            }

                            
                            const tripleMap =   tPCSLM[targetLabel][propCategory][sourceLabel];
                            let tripleMapIsNew = true;
                            for(let j=0;j<tripleMap['sourceUris'].length;j++){
                                if(tripleMap['sourceUris'][j] ===  tripleInfo.sourceUris[i]
                                    && tripleMap['propertyUris'][j] ===  tripleInfo.propertyUris[i]
                                    && tripleMap['targetUris'][j] ===  tripleInfo.targetUris[i]
                                    && tripleMap['endpointUris'][j]===  tripleInfo.endpointUri
                                    && tripleMap['endpointKeys'][j]===  endpointKey
                                    ){
                                        tripleMapIsNew =false;
                                        break;
                                    }
                            }
                            if(tripleMapIsNew){
                                tripleMap['sourceUris'].push(tripleInfo.sourceUris[i]);
                                tripleMap['propertyUris'].push(tripleInfo.propertyUris[i]);
                                tripleMap['targetUris'].push(tripleInfo.targetUris[i]);
                                tripleMap['endpointUris'].push(tripleInfo.endpointUri);
                                tripleMap['endpointKeys'].push(endpointKey);
                            }
                        }
                    }
                })
            })

            setTargetPropCategorySourceLabelMap(tPCSLM);

            console.log(' tPCSLM: ',tPCSLM);


        },[linkedConceptMap]
    );


    function getTargetLabels(){
        return null ;
    }
    
    function getLinkedSearchPathList(targetLabel){
        console.log(`getLinkedSearchPathList ${targetLabel}`)
        const searchPathList = [];

        Object.entries(targetPropCategorySourceLabelMap[targetLabel]).map(([propCategory, sourceLabelMap])=>{
            Object.entries(sourceLabelMap).map(([sourceLabel, tripleInfo])=>{
                searchPathList.push(`${sourceLabel} > ${propCategory} > ${targetLabel}`);
                console.log(` ${sourceLabel} > ${propCategory} > ${targetLabel}`)
            })
        })
        
        return searchPathList;

    }

    return(
        <Card>
            {// {}
            // Object.getOwnPropertyNames(linkedSearchPathMap).length>0?(
            // //    <>{Object.getOwnPropertyNames(linkedSearchPathMap)[0]}</>
            //     Object.getOwnPropertyNames(linkedSearchPathMap).map(targetLabel =>
            //         // <Card className="d-grid gap-2">
            //         //     <Card.Header>
            //         //         {targetLabel}
            //         //     </Card.Header>
                        
            //         //     <Card.Body>    
            //                 <LinkedSearchDatasetVarTable 
            //                     linkedSearchPathList = {[`${linkedSearchPathMap[targetLabel].sourceLabels[0]}>${targetLabel}`]}
            //                     linkedSearchLabel ={targetLabel}
            //                     endpointUri = {linkedSearchPathMap[targetLabel].endpointUri}
            //                 ></LinkedSearchDatasetVarTable>
            //         //     </Card.Body>  
            //         // </Card>
            //     )
            // ):(
            //     <Card className="d-grid gap-2"> Results for Linked Discovery ... </Card>
            // )
            // }
            }

            <Card.Header>
                Open linked dataset metadata retrieval
            </Card.Header>

            <div style={{overflow:"scroll", width:"100%", maxHeight:"400px"}}>
                <Container >
                    <Row className='gx-5' >
                        <Col lg={12} >
                {
                    Object.keys(targetPropCategorySourceLabelMap).length>0?(
                        Object.keys(targetPropCategorySourceLabelMap).map((targetLabel) =>
                            <>
                            <Row>
                                <LinkedSearchDatasetVarTable 
                                    linkedSearchPathList = {getLinkedSearchPathList(targetLabel)}
                                    searchTerm ={targetLabel}
                                    kbUri = {kbUri}
                                    height={200}
                                    setDatasetUriCallBack = {setDatasetUriCallBack}
                                ></LinkedSearchDatasetVarTable>
                                
                            </Row>
                            <br></br>
                            </>
                        )
                        ):(
                            <>  </>
                        )

                }
                </Col>
                </Row>
                </Container>
            </div>
        </Card>
    );
}