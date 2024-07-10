
export const prefix2uri = {
    'skos:':'http://www.w3.org/2004/02/skos/core#',
    'sosa:': 'http://www.w3.org/ns/sosa/',
    'ucmm:':'http://purl.org/ucmm#',
    'rdf:': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'dcat:':'http://www.w3.org/ns/dcat#',
    'dcterms:':'http://purl.org/dc/terms/',
    'cpm:':  'http://purl.org/voc/cpm#' ,
    'geo:': 'http://www.opengis.net/ont/geosparql#',
    'ssn-ext:': 'http://www.w3.org/ns/ssn/ext/' ,
    'time:':  'http://www.w3.org/2006/time#',
    'xsd:':  'http://www.w3.org/2001/XMLSchema#',
    'prov:': 'http://www.w3.org/ns/prov#',

    'i1:':'http://example.org/b2a5ed57-5c4e-4596-b803-d2ac7f5b9991#',
    'i2:':'http://example.org/51824c86-ae0f-442f-9df2-e86244984ba3#',
    'i3:':'http://example.org/97b4842b-94b3-4205-8781-476813d8177b#',
    'i4:':'http://example.org/e747d804-a5d1-4fd1-bd9b-306a8ebd4904#',
    'i5:': 'http://example.org/de5b570a-b560-4e84-a755-52c2aa499874#',
    'i6:': 'http://example.org/3df904de-e47d-4bf9-85a0-7c0942aff8b6#',
    'i7:': 'http://example.org/BDML_TCHR#',
    'i8:': 'http://example.org/4f676524-a831-41fe-9afb-d95f4e7597e3#',
    'i9:': 'http://example.org/f4968943-ad6f-4563-a737-58fe3285fb3c#',
    'i10:': 'http://example.org/17e24931-ccd6-4de0-a01c-9ffb3be88461#',
    ':' :'http://example.org/'
};

export function getPrefixFromUri(resourceUri){

    // console.log(`getPrefixFromUri(resourceUri: ', ${resourceUri})`);

    let prefix = '';
    Object.entries(prefix2uri).forEach( ([prefixKey,uri]) => {
        if(resourceUri.includes(uri)){
            // console.log(` resourceUri.includes(${uri})`);
            prefix = prefixKey;
            return; // exit forEach function
        }
    })

    // console.log(` prefix: ', ${prefix}`);

    return prefix;
}

export function getPrefixedUri(resourceUri){

    // console.log(`getPrefixedUri(resourceUri: ', ${resourceUri})`);

    const prefix = getPrefixFromUri(resourceUri);

    if(prefix==='')
        return resourceUri;

    const prefixUri = prefix2uri[prefix];
    const prefixedUri = resourceUri.replace(prefixUri,prefix);

    // console.log(` prefixedUri:  ${prefixedUri}`);

    return prefixedUri;
}


export function getExtentedUri(prefixedUri){
    const indexFirstColon = prefixedUri.indexOf(':');
    if(indexFirstColon>-1){
        const namespaceUri = prefixedUri.slice(0,indexFirstColon+1);
        const localResourceId = prefixedUri.slice(indexFirstColon+1)
        if(Object.hasOwn(prefix2uri,namespaceUri)){
            return prefix2uri[namespaceUri]+localResourceId;
        }
    }
    return prefixedUri;
}


export const prefix2group ={ // THEAI ODATIS FORMATER AERIS
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
    'prov:':5,
    'sosa:':6,
    'ucmm:':7,
    'rdf:': 8,
    'dcat:':9,
    'dcterms:':10
}


export function getGroupFromPrefixedUri(prefixedUri){

    // console.log('getGroupFromPrefixedUri',prefixedUri);
    
    const  end = String(prefixedUri).indexOf(":");


    if(end<0)
        return 4;

    const prefix= prefixedUri.substring(0,end+1)

    
    if(prefix2group[prefix]){
        return prefix2group[prefix];
    }else{
        return 4;
    }
}

export function getGroupFromProvService(serviceCalls){

    if(!serviceCalls)
        return 8;
    
    if(serviceCalls.length>1)
        return 7;

    switch (serviceCalls[0]){
        
        case 'http://example.org/prov/ServiceCall_AERIS' : return 1;
        case 'http://example.org/prov/ServiceCall_FORMATER' : return 2;
        case 'http://example.org/prov/ServiceCall_THEIA' : return 3;
        case 'http://example.org/prov/ServiceCall_THEIA-HYDRO' : return 4;
        case 'http://example.org/prov/ServiceCall_ODATIS' : return 5;


        case ':prov/ServiceCall_AERIS' : return 1;
        case ':prov/ServiceCall_FORMATER' : return 2;
        case ':prov/ServiceCall_THEIA' : return 3;
        case ':prov/ServiceCall_THEIA-HYDRO' : return 4;
        case ':prov/ServiceCall_ODATIS' : return 5;
        
        default: return 6;
    }
}

export  function getGroupColor(group){

    console.log('group',group)

    switch(group){

            case 1 : return `#3Cf`; // bleu ciel
            case 2 : return `#c30`; // rouge terre
            case 3 :  return `#f00`;  // orange
            case 4 : return `#36C`; // bleu violet
            case 5 : return `#039`; // dark bleu
            
            case 7 : return `#039`; // light purple   
            case 8 : return `#fff`; // white             
            
            default: return '#000'; // black
        }

}

export  function getColorFrom(serviceCalls){
    if(!serviceCalls)
        return '#000';
    if(serviceCalls.length==1){
        const serviceCall = serviceCalls[0];
        switch(serviceCall){

            case 'http://example.org/prov/ServiceCall_AERIS' : return `#3Cf`; // bleu ciel
            case 'http://example.org/prov/ServiceCall_FORMATER' : return `#c30`; // rouge terre
            case 'http://example.org/prov/ServiceCall_THEIA' :  return `#f00`;  // orange
            case 'http://example.org/prov/ServiceCall_THEIA-HYDRO' : return `#36C`; // bleu violet
            case 'http://example.org/prov/ServiceCall_ODATIS' : return `#039`; // dark bleu
            
            default: return '#000';
        }
    }else{
        return '#c9f'
    }

}



export function getLocalUri( fullUri){
    const indexFirstHashtag = fullUri.indexOf('#');
    if(indexFirstHashtag>-1){
        return ":"+fullUri.slice(indexFirstHashtag+1)
    }
}

export function getMetaDataId(datasetUri){
    const base = "http://example.org/";
    const indexFirstHashtag = datasetUri.indexOf('#');
    return datasetUri.slice(base.length,indexFirstHashtag);
}

export function getDatasetUri(metadataId){
    return "http://example.org/"+metadataId+"#dataset"
}

function decodedMetaDataId(datasetUri){
    return getMetaDataId(datasetUri).replaceAll("U+2215","/").replaceAll("U+003F","?").replaceAll(" ", "U+0020");
}

export function dataHubName( serviceCall){
    return serviceCall.replace('http://example.org/prov/ServiceCall_','').replace(':prov/ServiceCall_','');
}

export function getProvService(serviceCall,datasetUri){
    const metaDataId = decodedMetaDataId(datasetUri)
    switch (serviceCall){
        
        
        case 'http://example.org/prov/ServiceCall_AERIS' : return `https://api.sedoo.fr/aeris-catalogue-prod/csw?service=CSW&version=2.0.2&request=GetRecordById&id=${metaDataId}&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full`; // To add &outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full
        case 'http://example.org/prov/ServiceCall_FORMATER' : return `https://catalogue-terresolide.ipgp.fr/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&id=${metaDataId}&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full`;
        case 'http://example.org/prov/ServiceCall_THEIA' : return ` https://in-situ.theia-land.fr/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&id=${metaDataId}&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full`;
        case 'http://example.org/prov/ServiceCall_THEIA-HYDRO' : return `https://hydroweb-csw.theia-land.fr/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&id=${metaDataId}&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full`;
        case 'http://example.org/prov/ServiceCall_ODATIS' : return `https://sextant.ifremer.fr/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&id=${metaDataId}&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full`;
        
        case ':prov/ServiceCall_AERIS' : return `https://api.sedoo.fr/aeris-catalogue-prod/csw?service=CSW&version=2.0.2&request=GetRecordById&id=${metaDataId}&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full`; // To add &outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full
        case ':prov/ServiceCall_FORMATER' : return `https://catalogue-terresolide.ipgp.fr/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&id=${metaDataId}&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full`;
        case ':prov/ServiceCall_THEIA' : return ` https://in-situ.theia-land.fr/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&id=${metaDataId}&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full`;
        case ':prov/ServiceCall_THEIA-HYDRO' : return `https://hydroweb-csw.theia-land.fr/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&id=${metaDataId}&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full`;
        case ':prov/ServiceCall_ODATIS' : return `https://sextant.ifremer.fr/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&id=${metaDataId}&outputSchema=http://www.isotc211.org/2005/gmd&ElementSetName=full`;
        
        
        
        default: return "service call: "+dataHubName(serviceCall);
    }
}

export function getProvPage(serviceCall,datasetUri){
    const metaDataId = decodedMetaDataId(datasetUri)
    switch (serviceCall){
        
        case 'http://example.org/prov/ServiceCall_AERIS' : return `https://www.aeris-data.fr/catalogue/?uuid=${metaDataId}`; 
        case 'http://example.org/prov/ServiceCall_FORMATER' : return `https://www.poleterresolide.fr/acces-aux-donnees/catalogue/#/metadata/${metaDataId}`;
        case 'http://example.org/prov/ServiceCall_THEIA' : return `https://in-situ.theia-land.fr/description/dataset/${metaDataId}`;
        case 'http://example.org/prov/ServiceCall_THEIA-HYDRO' : return `https://hydroweb.theia-land.fr/description/dataset/${metaDataId}`;
        case 'http://example.org/prov/ServiceCall_ODATIS' : return `https://www.odatis-ocean.fr/en/data-and-services/data-access/direct-access-to-the-data-catalogue#/metadata/${metaDataId}`;
        
        case ':prov/ServiceCall_AERIS' : return `https://www.aeris-data.fr/catalogue/?uuid=${metaDataId}`; 
        case ':prov/ServiceCall_FORMATER' : return `https://www.poleterresolide.fr/acces-aux-donnees/catalogue/#/metadata/${metaDataId}`;
        case ':prov/ServiceCall_THEIA' : return `https://in-situ.theia-land.fr/description/dataset/${metaDataId}`;
        case ':prov/ServiceCall_THEIA-HYDRO' : return `https://hydroweb.theia-land.fr/description/dataset/${metaDataId}`;
        case ':prov/ServiceCall_ODATIS' : return `https://www.odatis-ocean.fr/en/data-and-services/data-access/direct-access-to-the-data-catalogue#/metadata/${metaDataId}`;
        
        
        default: return "service call: "+serviceCall;
    }
}
