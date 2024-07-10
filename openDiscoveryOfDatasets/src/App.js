import {useEffect,useState} from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import SearchTermForm from './components/SearchTermForm';
import RetrievedDatasetVarTable from './components/bindingVarTable/RetrievedDatasetVarTable'
import EndpointsCheckBox from './components/EndpointsCheckBox';
import LinkedSearchVarTableList from './components/LinkedSearchVarTableList';

import NetworkDiagram  from './examples/react-graph-gallery/NetworkDiagramBasicCanvas/NetworkDiagram';
import data from './examples/react-graph-gallery/NetworkDiagramBasicCanvas/data';
import DatasetDiscoveryExplainedGraph from './components/DatasetDiscoveryExplainedGraph';
import DatasetDiscoveryExplainedSVGGraph from './components/DatasetDiscoveryExplainedSVGGraph';
import DatasetDiscoveryExplainedSVGGraph_v2 from './components/DatasetDiscoveryExplainedSVGGraph_v2';
import DatasetExplainedGraph from './components/DatasetExplainedGraph';

import ExplainedDatasetDiscovery from './components/ExplainedDatasetDiscovery';
import DatasetCard from './components/DatasetCard';



const App = () => {

  const [searchTerm, setSearchTerm] = useState(''); 

  const rdf4jRepositories = 'http://13.36.171.5:8009/rdf4j-server/repositories/';
  // const kbUri = 'http://13.36.171.5:8009/rdf4j-server/repositories/ucmm_instance_graph';
  const kbUri = 'http://13.36.171.5:8009/rdf4j-server/repositories/dataterra_kg';

  //const rdf4jRepositories = 'http://localhost:8080/rdf4j-server/repositories/';
  // const kbUri = 'http://localhost:8080/rdf4j-server/repositories/ucmm_instance_graph';
  //const kbUri = 'http://localhost:8080/rdf4j-server/repositories/DataTerraKG';
  

  const [datasetUri, setDatasetUri] = useState('');


  const [linkedConceptMap, setLinkedConceptMap] = useState({});

  useEffect(
    ()=>{
      setDatasetUri('');
      console.log('search term update', searchTerm)
    },
    [searchTerm]
  )

  return (
    // <Container className='overflow-hidden'>
    <Container>
      <Row>
        <div class="d-flex justify-content-center">
          <h1 >  Earth System Dataset Open Discovery </h1>
        </div>
      </Row>
      <Row>
        <div class="d-flex justify-content-center">
          {/* <p text-align="center">  */}
            This prototype search engine merges dataset metadata from four &nbsp; <a href='https://www.data-terra.org/en/' target="_blank" rel="noopener noreferrer"> DATA TERRA </a>'s &nbsp; data-hubs: &nbsp;
              <a href='https://www.aeris-data.fr/en/catalogue-en/' target="_blank" rel="noopener noreferrer" >AERIS</a>, &nbsp; 
               < a href='https://en.poleterresolide.fr/data-access/catalog/#/' target="_blank" rel="noopener noreferrer" >FORMATER</a>, &nbsp;  
               < a href='https://catalogue.theia-land.fr' target="_blank" rel="noopener noreferrer" >THEIA</a>, &nbsp; 
               < a href='https://www.odatis-ocean.fr/en/' target="_blank" rel="noopener noreferrer" >ODATIS</a>
              . 
              {/* Each data-hub collects observations about a different Earth System Compartment respectively, the Atmosphere, the Oceans, the Solid Earth and the Continental Surfaces.   */}
          {/* </p>  */}
        </div>
      </Row>
      <Row>
        <div class="d-flex justify-content-center">
            Each data-hub collects observations about an Earth System Compartment: the Atmosphere ,the Solid Earth, the Continental Surfaces and the the Oceans. 
            <br></br>
        </div>  
      </Row>

      <Row className='gx-5'>
        <Col lg={3} >
          <Row>
            <SearchTermForm kbUri={kbUri} updateCallBack={setSearchTerm} />
         </Row>
         <br></br>
         <Row>
          <EndpointsCheckBox
            rdf4jRepositories ={rdf4jRepositories}
            searchTerm={searchTerm}
            setLinkedConceptMapCallBack={setLinkedConceptMap}
            />
          </Row> 
          
        </Col>
        
        <Col lg={6} >
          <Row>
              <DatasetExplainedGraph kbUri={kbUri} datasetUri={datasetUri} width={600} height={320} termInfo={{term:searchTerm}}></DatasetExplainedGraph>
              {/* <DatasetDiscoveryExplainedSVGGraph_v2 kbUri={kbUri} width={800} height={600} termInfo={{term:searchTerm}}></DatasetDiscoveryExplainedSVGGraph_v2> */}
          </Row>
          <br></br>
          <Row>
            
            <RetrievedDatasetVarTable searchTerm={searchTerm} kbUri={kbUri} setDatasetUriCallBack={setDatasetUri} />
            {/* <DatasetDiscoveryExplainedGraph kbUri={kbUri} width={400} height={400} termInfo={{term:searchTerm}} ></DatasetDiscoveryExplainedGraph> */}
            {/* <DatasetDiscoveryExplainedSVGGraph kbUri={kbUri} width={600} height={400} termInfo={{term:searchTerm}}></DatasetDiscoveryExplainedSVGGraph> */}
            {/* <ExplainedDatasetDiscovery kbUri={kbUri} width={600} height={400} termInfo={{term:searchTerm}}></ExplainedDatasetDiscovery> */}
            {/* <NetworkDiagram data={data} width={400} height={400} />  */}
  
          </Row>
          <br></br>
          <Row>
           <LinkedSearchVarTableList linkedConceptMap={linkedConceptMap} kbUri={kbUri} setDatasetUriCallBack={setDatasetUri} /> 
          </Row>

        </Col>

        <Col lg={3} >
        <Row>
            <DatasetCard datasetUri={datasetUri} kbUri={kbUri}></DatasetCard>
          </Row>
        </Col>

      </Row>
      
    </Container>
  );

};

export default App;

/*
npm run build && ssh -i ~/.ssh/portableHP.pem ec2-user@13.38.36.148 'rm -rf ~/tomcat9/webapps/ReactRestApiCall/*' && scp -r -i ~/.ssh/portableHP.pem ./build/* ec2-user@13.38.36.148:~/tomcat9/webapps/ReactRestApiCall/
*/

/* Test Felipe
  npm run build &&
  sudo rm -rf  /opt/tomcat9/webapps/earthObservationDatasetOpenDiscovery/ &&
  sudo mkdir   /opt/tomcat9/webapps/earthObservationDatasetOpenDiscovery/ &&
  sudo cp -R build/*   /opt/tomcat9/webapps/earthObservationDatasetOpenDiscovery/ 
*/

/* Test 
  npm run build &&
  rm -rf ~/workspace/tomcat/tomcat9/apache-tomcat-9.0.85_v2/webapps/earthObservationDatasetOpenDiscovery &&
  mkdir  ~/workspace/tomcat/tomcat9/apache-tomcat-9.0.85_v2/webapps/earthObservationDatasetOpenDiscovery &&
  cp -R build/*  ~/workspace/tomcat/tomcat9/apache-tomcat-9.0.85_v2/webapps/earthObservationDatasetOpenDiscovery 

*/

/*
npm run build && 
ssh -i ~/.ssh/portableHP.pem ubuntu@13.36.171.5 'rm -rf earthObservationDatasetOpenDiscovery' &&
ssh -i ~/.ssh/portableHP.pem ubuntu@13.36.171.5 'mkdir earthObservationDatasetOpenDiscovery' &&
scp -r -i ~/.ssh/portableHP.pem ./build/* ubuntu@13.36.171.5:~/earthObservationDatasetOpenDiscovery/ &&
ssh -i ~/.ssh/portableHP.pem ubuntu@13.36.171.5 'sudo rm -rf /opt/tomcat/apache-tomcat-9.0.88/webapps/earthObservationDatasetOpenDiscovery' &&
ssh -i ~/.ssh/portableHP.pem ubuntu@13.36.171.5 'sudo cp -R  earthObservationDatasetOpenDiscovery  /opt/tomcat/apache-tomcat-9.0.88/webapps/' &&
ssh -i ~/.ssh/portableHP.pem ubuntu@13.36.171.5 'sudo chown -R tomcat:tomcat  /opt/tomcat/apache-tomcat-9.0.88/webapps/earthObservationDatasetOpenDiscovery'
*/