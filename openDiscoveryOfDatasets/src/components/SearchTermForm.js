import {useState,useEffect} from 'react'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { Card } from 'react-bootstrap';

export default function SearchTermForm({kbUri,updateCallBack}){

    const [searchTerm, setSearchTerm] = useState(''); 

    const [storedLabels,setStoredLabels] = useState([]);

    const [dataLoaded, setDataLoaded] = useState(false);

    async function  fetchStoredLabels ( )  {
        try { 

            if(dataLoaded)
                return;

            const queryTxt = 
                'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> '
                +'SELECT DISTINCT ?storedLabel WHERE {?concept skos:prefLabel ?storedLabel }'

            const endpoint_uri = kbUri;

            const response = await fetch(endpoint_uri,{
                method: "POST",
                credentials: "same-origin",
                headers:{
                    "Content-Type": 'application/x-www-form-urlencoded',
                    "xhrFields": {withCredentials: true},
                     "Accept" : "application/json",
                },
                redirect: "follow",
                referrerPolicy: "no-referrer",
                body: "query="+ queryTxt.replaceAll('\n',' ')
            }
            )            
            
            const jsonData = await response.json();
                        
            if(jsonData){
                if(jsonData.results){
                    if(jsonData.results.bindings){
                        
                        setDataLoaded(true);
                        setStoredLabels(jsonData.results.bindings);

                        // console.log('jsonData.results.bindings',jsonData.results.bindings);
                    }
                }
                
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }


    function handleSearchClick(){
        updateCallBack(searchTerm);
        console.log('update Search Label call back',searchTerm);
    }


    useEffect (
        () =>{
            fetchStoredLabels();
       },[dataLoaded] 
   );

   
    return (
        dataLoaded?(
            <Card>
                <Card.Header>Search term</Card.Header>
                <Card.Body>
                <InputGroup className="mb-3">
                        <InputGroup.Text id='searchTermInputGroup'>{"Term :"}</InputGroup.Text>
                        <Form.Control 
                            
                            id='search label'
                            placeholder='Type a term'
                            aria-aria-label='search term'
                            aria-describedby='searchTermInputGroup'
                            
                            // autoComplete='on'
                            // data = {['un','deux','trois']}
                            list='storeLabelListOption'
                            value={searchTerm} 
                            onChange={e =>setSearchTerm(e.target.value)}
                        />
                        <datalist id = 'storeLabelListOption'>
                            {
                            storedLabels.map( binding => 
                                <option >{binding.storedLabel.value}</option>
                            )}
                        </datalist>

                </InputGroup>
                {/* <p>{'  Selected : '+searchTerm}</p> */}
                <div class="d-grid gap-2">
                    <Button size="lg" variant="outline-secondary" id="button-search"  onClick={handleSearchClick}>
                        Retrieve Datasets
                    </Button>
                </div>
                </Card.Body>
            </Card>
        ):(
            <p>loading ... </p>
        )
    )
    
}
