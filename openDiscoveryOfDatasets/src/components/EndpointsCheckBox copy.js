import { useState,useEffect } from "react";
import Form  from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card  from "react-bootstrap/Card";
import Spinner from 'react-bootstrap/Spinner';
import Modal  from "react-bootstrap/Modal";

export default function EndpointsCheckBox({rdf4jRepositories,searchLabel, setLinkedConceptMapCallBack}){

    const [endpoints, setEndpoints] = useState({
        agrovoc:{
            name:'AGROVOC',
            uri: rdf4jRepositories+'agrovoc',
            enabledEndpoint :false,
            enabledPropertyCategories:{
                narrower : false,
                broader : false
            }
        },gcmd:{
            name:'GCMD',
            uri: rdf4jRepositories+'gcmd',
            enabledEndpoint :false,
            enabledPropertyCategories:{
                narrower : false,
                broader : false
            }
        }
    });

    const [linkedConceptMap,setLinkedConceptMap]=useState({
        agrovoc:{
            narrower :{
                sourceUris:[],
                sourceLabels:[],
                propertyUris: [],
                targetUris:[],
                targetLabels:[],
                endpointUri: rdf4jRepositories+'agrovoc'
            },
            broader :{
                sourceUris:[],
                sourceLabels:[],
                propertyUris: [],
                targetUris:[],
                targetLabels:[],
                endpointUri: rdf4jRepositories+'agrovoc'
            }
        },
        gcmd:{
            narrower :{
                sourceUris:[],
                sourceLabels:[],
                propertyUris: [],
                targetUris:[],
                targetLabels:[],
                endpointUri: rdf4jRepositories+'gcmd'
            },
            broader :{
                sourceUris:[],
                sourceLabels:[],
                propertyUris: [],
                targetUris:[],
                targetLabels:[],
                endpointUri: rdf4jRepositories+'gcmd'
            }
        },
    })


    const [showModal,setShowModal]=useState(false);


    useEffect (
        () =>{
           if(searchLabel !== ''){
                Object.entries(endpoints).map( ([endpointKey, endpointProps]) => {
                    Object.entries(endpoints[endpointKey]['enabledPropertyCategories']).map(([propCategory, enabledPropCategory ])=>{
                        if(enabledPropCategory){
                            fetchLinkedConcepts(endpointKey,propCategory);
                        }
                    } )
            })
           }
       },
       [searchLabel]
   );


    function getSkosPropUris(propCategory){
        switch(propCategory){
            case 'narrower' : return ['http://www.w3.org/2004/02/skos/core#narrower','http://www.w3.org/2008/05/skos#narrower','http://www.w3.org/2004/02/skos/core#narrowerTransitive','http://www.w3.org/2008/05/skos#narrowerTransitive'];
            case 'broader' : return ['http://www.w3.org/2004/02/skos/core#broader','http://www.w3.org/2008/05/skos#broader','http://www.w3.org/2004/02/skos/core#broaderTransitive','http://www.w3.org/2008/05/skos#broaderTransitive'];
            default :return [];
        }
    }

    function propUriBelongsToPropCategory (propUri,propCategory){
        // console.log('propUriBelongsToPropCategory',propUri,propCategory)

        let propUriBelongsToCategory = false;
        getSkosPropUris(propCategory).map(p => {if(p===propUri){propUriBelongsToCategory= true; return true;}});

        // console.log('propUriBelongsToCategory',propUriBelongsToCategory);
        return propUriBelongsToCategory;
    }

    async function  fetchLinkedConcepts ( endpointKey,propCategory)  {
        try { 
 
            console.log("fetchLinkedConcepts: "+endpointKey, propCategory, searchLabel);

            const queryTxt = 
                'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> '+
                'SELECT DISTINCT ?searchConceptUri ?searchConceptLabel ?linkedPropertyUri ?linkedConceptUri ?linkedConceptLabel  '+
                'WHERE { '+
                ' ?searchConceptUri skos:prefLabel ?searchConceptLabel. '+
                ' ?searchConceptUri ?linkedPropertyUri ?linkedConceptUri. '+
                ' ?linkedConceptUri skos:prefLabel ?linkedConceptLabel. '+
                '  FILTER (regex(?searchConceptLabel,"^'+searchLabel+'$","i") )'+
                '  FILTER (lang(?searchConceptLabel)="en")'+
                '  FILTER (lang(?linkedConceptLabel)="en")'+
                '}';

            console.log('queryTxt',queryTxt);
 

            const endpoint_uri = endpoints[endpointKey]['uri'];

            setShowModal(true);
            const response = await fetch(endpoint_uri,{
                method: "POST",
                credentials: "same-origin",
                mode: "no-cors",
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

            setShowModal(false);

            console.log(' jsonData: ', jsonData);

            
            const retrievedSearchConceptUris =[];
            const retrievedSearchConceptLabels =[];
            const retrievedLinkedConceptUris =[];
            const retrievedLinkedConceptLabels =[];
            const retrievedLinkedPropertyUris =[]; 

            

            if(jsonData){
                if(jsonData.results){
                    if(jsonData.results.bindings){

                        jsonData.results.bindings.map( binding => {
                            
                            // ?searchConceptUri ?searchConceptLabel ?linkedPropertyUri ?linkedConceptUri ?linkedConceptLabel 

                            if(propUriBelongsToPropCategory(binding['linkedPropertyUri']['value'],propCategory)){
                            
                                retrievedSearchConceptUris.push(binding['searchConceptUri']['value']);
                                retrievedSearchConceptLabels.push(binding['searchConceptLabel']['value']);
                                retrievedLinkedPropertyUris.push(binding['linkedPropertyUri']['value']);
                                retrievedLinkedConceptUris.push(binding['linkedConceptUri']['value']);
                                retrievedLinkedConceptLabels.push(binding['linkedConceptLabel']['value']);


                            }
                        });

                        
                        // console.log('jsonData.results.bindings',jsonData.results.bindings);
                    }
                }
            }

            const updatedLinkedConceptMap = {
                ...linkedConceptMap,
                [endpointKey]:{
                    ...linkedConceptMap[endpointKey],
                    [propCategory]:{
                        ...linkedConceptMap[endpointKey][propCategory],
                        sourceUris:retrievedSearchConceptUris,
                        sourceLabels:retrievedSearchConceptLabels,
                        propertyUris: retrievedLinkedPropertyUris,
                        targetUris:retrievedLinkedConceptUris,
                        targetLabels:retrievedLinkedConceptLabels
                    }
                }
            };
            setLinkedConceptMap(updatedLinkedConceptMap);
            setLinkedConceptMapCallBack(updatedLinkedConceptMap);

            console.log('updatedLinkedConceptMap ',updatedLinkedConceptMap);
            
            

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function handleSwitchClick(endpointKey,propCategory,checked){
        console.log('handleSwitchClick: ',endpointKey, propCategory, checked);

        const updatedEndpoints = {
            ...endpoints,
            [endpointKey] : { 
                ...endpoints[endpointKey],
                ['enabledPropertyCategories']:{
                    ...endpoints[endpointKey]['enabledPropertyCategories'],
                    [propCategory]: checked}
                }
                
        };
        setEndpoints(updatedEndpoints);

        console.log(" updatedEndpoints ",updatedEndpoints);

        if(searchLabel !=='' && checked){
            fetchLinkedConcepts(endpointKey,propCategory);
        }
        if(!checked){
            const updatedLinkedConceptMap = {
                ...linkedConceptMap,
                [endpointKey]:{
                    ...linkedConceptMap[endpointKey],
                    [propCategory]:{
                        ...linkedConceptMap[endpointKey][propCategory],
                        sourceUris:[],
                        sourceLabels:[],
                        propertyUris: [],
                        targetUris:[],
                        targetLabels:[]
                    }
                }
            };
            setLinkedConceptMap(updatedLinkedConceptMap);
            setLinkedConceptMapCallBack(updatedLinkedConceptMap);
            console.log('updatedLinkedConceptMap ',updatedLinkedConceptMap);
        }

        
            

    }

    function handleEndpointClick(endpointKey,checked){

        console.log('handleEndpointClick: ',endpointKey,checked)

        const updatedEndpoints = {
            ...endpoints,
            [endpointKey] : { 
                ...endpoints[endpointKey],
                ['enabledEndpoint']: checked}
        };
        setEndpoints(updatedEndpoints);
        

        console.log(" updatedEndpoints ",updatedEndpoints);

    }


    return(
        <Card>
            <Card.Header>
                Enable open link discovery
            </Card.Header>
            <Card.Body>
                <Form className="d-grid gap-2">
                    { Object.entries(endpoints).map( ([endpointKey, endpointProps]) =>

                    <>
                        <Button 
                            variant="outline-secondary" 
                            size="lg" 
                            id={`${endpointKey}-button`} 
                            onClick={e=>handleEndpointClick(endpointKey,!endpointProps['enabledEndpoint'])}>
                                {endpointProps.name}
                        </Button>
                        <Modal
                            show={showModal}
                           
                            backdrop="static"
                            keyboard={false}
                        >
                            <Modal.Body >
                                <p>Please wait an instant, we are querying the endpoint ...</p>
                                <Spinner animation="border" variant="secondary" />
                                <Spinner animation="border" variant="secondary" />
                                <Spinner animation="border" variant="secondary" />
                            </Modal.Body>
                            
                        </Modal>
                        
                        {(endpointProps['enabledEndpoint'])?(
                                Object.keys(endpointProps['enabledPropertyCategories']).map( propCategory =>
                                <>
                                    <Form.Check
                                        type="switch"
                                        id={`${endpointKey}-${propCategory}-switch`}
                                        label={propCategory}
                                        checked = {endpointProps['enabledPropertyCategories'][propCategory]}
                                        onChange={e => handleSwitchClick(endpointKey,propCategory,e.target.checked)}
                                    />
                                    {   (searchLabel!=='' && linkedConceptMap[endpointKey]['conceptLabels'])?(
                                            <p>{linkedConceptMap[endpointKey]['conceptLabels'].map(l => l+" ")}</p>
                                        ):(
                                            <> </>
                                        )
                                    }
                                </>
                                )
                        ):(
                            <></>
                        )
                        }
                    </>
                    )}
                </Form>
            </Card.Body>
            
        </Card>
    )
}