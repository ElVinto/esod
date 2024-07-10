import {useState,useEffect} from 'react'
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

export default function ExecQueryBindingVarTable(){

    const endpoint_uri = 'http://13.38.36.148:8080/rdf4j-server/repositories/ucmm_instance_graph';
    
    // const [varNames,setVarNames] = useState(["s","p","o"]);
    // const [bindings, setBindings] = useState([
    //     {s:{value: 's1'},p:{value: 'p1'},o:{value:'o1'}},
    //     {s:{value: 's2'},p:{value: 'p2'},o:{value:'o2'}}
    // ]);

    const [varNames,setVarNames] = useState([]);
    const [bindings, setBindings] = useState([]);

    const [queryTxt, setQueryTxt] = useState(
        "SELECT * WHERE { ?s ?p ?o.  } limit 10"
    );

    async function  fetchData (url, d )  {
        try {  
            const response = await fetch(url,{
                method: "POST",
                credentials: "same-origin",
                headers:{
                    "Content-Type": 'application/x-www-form-urlencoded; charset=utf-8',
                    "xhrFields": {withCredentials: true},
                     "Accept" : "application/json",
                },
                redirect: "follow",
                referrerPolicy: "no-referrer",
                body: "query="+ d.replaceAll('\n',' ')
            }
            )            
            
            
            const jsonData = await response.json();
            
            console.log('jsonData: ', jsonData);
            
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

            console.log('varNames:', varNames); 
            console.log('bindings:', bindings);

            // console.log('bindings[0][s]["value"]: ', bindings[0][varNames[0]]["value"]);

            // bindings.map(binding =>
            //     varNames.map(varName => {
            //         console.log("<td> ", binding[varName]["value"], " </td>")
            //         })
            // )

        } catch (error) {
            console.log('Error:', error);
            
        }
    }

    useEffect (
         () =>{
             const resp =  fetchData(endpoint_uri, queryTxt);
        },
        []
    );

    function handleButtonClick(){
      fetchData(endpoint_uri, queryTxt).then( response => { console.log(response)});
    }

    function execQuery(){
        return(
            <InputGroup className="mb-3">
                <InputGroup.Text>{"Query: "}</InputGroup.Text>
                <Form.Control 
                    as="textarea" 
                    rows="3"
                    type='text'
                    placeholder={queryTxt}
                    value={queryTxt} 
                    onChange={e =>setQueryTxt(e.target.value)}
                    />
                <Button variant="outline-secondary" id="button-addon" onClick={handleButtonClick}>
                execute query
                </Button> 
            </InputGroup> 
        );
    }

    return(
        <>
            <div>
                {execQuery()}
            </div>
            <div>
                {/* {varNames ?( */}
                    <Table striped bordered hover responsive size='lg' >
                        <thead >
                            <tr text-align="center">
                                {varNames.map(v => <th> {v} </th> )}
                            </tr>
                        </thead>
                        <tbody>
                            {bindings.map(binding =>
                                <tr>
                                    {varNames.map(varName => 
                                        <td> {binding[varName]["value"]} </td>
                                    )}
                                </tr>
                            )}
                        </tbody>

                    </Table>
                {/* ):(
                    <p> Data not yet available ... </p>
                )} */}
            </div>
        </>
    )
}
