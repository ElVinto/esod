export  function SearchDatasetsMentioning(query_params,setResult){

    const queryTxt = 
        'PREFIX skos: <http://www.w3.org/2004/02/skos/core#> '+
        'PREFIX sosa: <http://www.w3.org/ns/sosa/> '+
        'PREFIX ucmm: <http://purl.org/ucmm#> '+
        'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> '+
        'PREFIX dcat: <http://www.w3.org/ns/dcat#> '+
        'PREFIX dcterms: <http://purl.org/dc/terms/> '+
        'SELECT DISTINCT ?dataset '+
        'WHERE{ '+
        '  { '+
        '    ?dataset rdf:type dcat:Dataset . '+
        '    ?dataset ?p ?concept . '+ // ?p matches: dcterms:subject, dcterms:theme
        '    ?concept skos:prefLabel ?searchLabel .'+ // ?p matches: dcterms:subject, dcterms:theme '+
        '  }UNION{ '+
        '    ?dataset rdf:type dcat:Dataset . '+
        '    ?dataset dcterms:description|dcterms:title ?searchLabel. '+ 
        '  }UNION{ '+
        '    ?dataset rdf:type dcat:Dataset . '+
        '    ?obsColl ucmm:hasAggregatedResult ?dataset . '+
        '    ?obsColl  (sosa:hasFeatureofInterest|sosa:hasUltimateFeatureofInterest) ?concept . '+
        '    ?concept skos:prefLabel ?searchLabel . '+
        '  }UNION{ '+
        '    ?dataset rdf:type dcat:Dataset .'+
        '    ?obsColl ucmm:hasAggregatedResult ?dataset .'+
        '    ?obsColl sosa:observedProperty ?concept .'+
        '    ?concept skos:prefLabel ?searchLabel .'+
        '  }'+
        '  FILTER ('+ 
        '    regex(?searchLabel,"'+query_params.label+'","i") '+
        '  )'+
        '  FILTER ('+ 
        '    lang(?searchLabel)="en"'+
        '  )'+
        '}';

    async function  fetchData (url, q )  {
        try {  
            const response = await fetch(url,{
                method: "POST",
                credentials: "same-origin",
                headers:{
                    "Content-Type": 'application/x-www-form-urlencoded',
                    "xhrFields": {withCredentials: true},
                        "Accept" : "application/json",
                },
                redirect: "follow",
                referrerPolicy: "no-referrer",
                body: "query="+ q.replaceAll('\n',' ')
            }
            )            
            
            const jsonData = await response.json();
            
            return jsonData;

        } catch (error) {
            console.log('Error:', error);
            
        }
    }
    

    return(
        fetchData(query_params.label)
        )
}