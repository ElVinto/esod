import {useState,useEffect} from 'react'
import Table from 'react-bootstrap/Table';
import { Card, Nav } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';

import { getMetaDataId,getDatasetUri } from '../../util/prefix_util';

export default function RetrievedDatasetVarTable({searchTerm, kbUri, setDatasetUriCallBack}){

    
    const [varNames,setVarNames] = useState([]);
    const [bindings, setBindings] = useState([]);

    const [fetchingData, setFetchingData] = useState(false);

    const [selectedDataHub,setSelectedDataHub] = useState('');

    const [selectedDataHubBindings,setSelectedDataHubBindings] = useState([]);

    
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
              FILTER (regex(?searchLabel,"${searchTerm}","i") )
              FILTER (lang(?searchLabel)="en")
            }`.toString().replace('\n',' ');
    }

    async function fetchData () {

        try {  

            setFetchingData(true)

            console.log(` fetchData(${searchTerm})`)
            console.log('  composeQuery : ',composeQuery());

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

            console.log('varNames:', varNames); 
            console.log('bindings:', bindings);

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

    function handleClickRow(e){

        console.log('handleClickRow', e)

        const metadatId = e.target.parentElement.attributes.mdid.nodeValue;

        console.log(' metadatId', metadatId)

        const datasetUri = getDatasetUri(metadatId);
        
        console.log(' clicked datasetUri: ',datasetUri);
        setDatasetUriCallBack(datasetUri);

    }

    function handleSelect (eventKey) {
        setSelectedDataHub(eventKey)
    };


    function computeSelectedDataHubBindings(selectedDataHub){
        
        const tmp_selectedDataHubBindings =[]

        if(selectedDataHub.indexOf("ALL")>=0){

            console.log('bindings ', bindings)

            bindings.forEach( binding => {tmp_selectedDataHubBindings.push(binding)})
            
            return tmp_selectedDataHubBindings ;

        }
        
        
        let idx = 0;
        for(let i=0;i< bindings.length;i++){
            const binding = bindings[i];
            if(binding['provenance']!==undefined){
                if(binding['provenance']['value']!==undefined){
                    
                    if(binding['provenance']['value'].indexOf(selectedDataHub)>=0){
                        // if(binding['provenance']['value'].indexOf("HYDRO")>=0 && selectedDataHub.indexOf("HYDRO")<0){
                        //     continue;
                        // }
                        tmp_selectedDataHubBindings.push(binding);
                    }
                }
            }
        }

        return tmp_selectedDataHubBindings;
    }


    useEffect (
         () =>{

            if(searchTerm == ''){
                return;
            }

            // console.log(`useEffect RetrieveDatasetVarTable`)
            // console.log(' kbUri : ',kbUri);
            // console.log(' searchTerm : ',searchTerm);
            console.log(' clean bindings ');
            setBindings([]);
            setSelectedDataHub('None'); // hack
            setSelectedDataHubBindings([]); // hack
            
            fetchData().then(() =>{
                setSelectedDataHub('ALL'); // if the term changes 
                setSelectedDataHubBindings(computeSelectedDataHubBindings('ALL'));
             });
            
        },
        [searchTerm]
    );

    useEffect (
        () =>{

            if(searchTerm == ''){
                return;
            }
            console.log('selectedDataHub '+selectedDataHub);  
            setSelectedDataHubBindings(computeSelectedDataHubBindings(selectedDataHub));
           
       },
       [selectedDataHub]
   );

   useEffect (
    () =>{

        if(searchTerm == ''){
            return;
        }
        console.log('selectedDataHubBindings '+selectedDataHubBindings);       
   },
   [selectedDataHubBindings]
);
    

 
    return(
        <Card>
            <Card.Header>

                {searchTerm?(
                        <ul>
                            <li>{searchTerm}</li>
                        </ul>
                    ):(
                        <></>
                )}  
                { selectedDataHubBindings.length>0?(
                    `Retrieved dataset metadata: ${selectedDataHubBindings.length} (Click on metadata title for details)`
                ):(
                    searchTerm?(
                        fetchingData?(
                            <>
                                `Fetching dataset metadata ... `
                                <Spinner animation="border" variant="secondary" />
                            </>
                        ):(
                            `Retrieved dataset metadata: ${selectedDataHubBindings.length} `
                        )
                    ):(
                        `Dataset metadata retrieval`
                    )
                )
            
                }
            </Card.Header>
            
                <div style={{overflow:"scroll", width:"100%", maxHeight:"320px"}}>
                {searchTerm!=''?(
                    varNames.length>0 ?(

                            <Card.Body >

                                <Nav justify variant="pills" defaultActiveKey="ALL" onSelect={handleSelect}>
                                    <Nav.Item>
                                        <Nav.Link eventKey="ALL" style={{color:'#000'}}>ALL</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="AERIS" style={{ color:'#3Cf'}}>AERIS</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="FORMATER" style={{color:'#c30'}}>FORMATER</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="THEIA" style={{color:'#f00'}}>THEIA-OZCAR</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="THEIA-HYDRO" style={{color:'#36C'}}>THEIA-HYDRO</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="ODATIS" style={{color:'#039'}}>ODATIS</Nav.Link>
                                    </Nav.Item>
                                    
                                </Nav>

                                <Table striped bordered hover responsive size='lg'  >
                                    <thead >
                                        {/* {varNames.map(v => <th text-align="center"> {`${v}(s)`} </th> )} */}

                                        <th text-align="center">  num  </th>
                                        <th text-align="center"> Dataset metadata title  </th>
                                    </thead>
                                    
                                    <tbody >
                                        
                                        {selectedDataHubBindings.map((binding,index) =>

                                            
                                            <tr mdId={getMetaDataId(binding['dataset']['value'])} onClick={e => handleClickRow(e)}>
                                                <td>{index+1}</td>
                                                {binding['title']===undefined?(
                                                        <td>{getMetaDataId(binding['dataset']['value'])}</td>
                                                    ):(
                                                        <td> {`${binding['title']["value"].slice(0,50)} ...`} </td>
                                                    )
                                                }
                                            </tr>


                                        )}
                                        
                                    </tbody>
                                    
                                </Table>
                            </Card.Body> 
                        
                    ):(
                        !fetchingData? (
                            <p> {` No Dataset matches: ${searchTerm} `}  </p>
                        ):(
                            <p> {` Retrieving datasets for: ${searchTerm} `} </p>
                        )
                    )
                ):(
                    <></>
                )
            }  
            </div >
            
        </Card>  
    )
}
