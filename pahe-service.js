(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */

    angular.module('facetApp')

    /*
     * finds service
     * Handles SPARQL queries and defines facet configurations.
     */
    .service('paheService', paheService);

    /* @ngInject */
    function paheService(FacetResultHandler, SPARQL_ENDPOINT_URL) {

        /* Public API */

        // Get the results based on the facet selections.
        this.getResults = getResults;
        // Get the facet definitions.
        this.getFacets = getFacets;
        // Get the facet options.
        this.getFacetOptions = getFacetOptions;

        /* Implementation */

        // Facet definitions
        // 'facetId' is a "friendly" identifier for the facet,
        //  and should be unique within the set of facets.
        // 'predicate' is the property that defines the facet (can also be
        //  a property path, for example).
        // 'name' is the title of the facet to show to the user.
        // If 'enabled' is not true, the facet will be disabled by default.

        var facets = {
            text: {
                facetId: 'name',
                predicate:'<http://ldf.fi/snellman/hasContent>/<http://ldf.fi/snellman/hasText> ',
                enabled: true,
                name: 'Haku tekstistä'
            },
            date: {
                facetId: 'date',
                predicate: '<http://purl.org/dc/elements/1.1/date> ',
                min: 1826,
                max: 1886,
                enabled: true,
                name: 'Vuosi',
            },
            dateTime: {
                facetId: 'dateTime',
                predicate: '<http://purl.org/dc/elements/1.1/date> ',
		startPredicate: '<http://purl.org/dc/elements/1.1/date>',
		endPredicate: '<http://purl.org/dc/elements/1.1/date>',
		min: '1826-01-01',
                max: '1886-31-12',
                enabled: true,
                name: 'Päivämäärä',
            },
            place: {
                facetId: 'place',
                predicate:'<http://purl.org/dc/elements/1.1/relation> ',
                enabled: true,
                name: 'Paikka',
                specifier: '?value a <http://ldf.fi/snellman/Place> .',
                chart: true,
		hierarchy: '<http://www.w3.org/2004/02/skos/core#broader>|<http://www.w3.org/2004/02/skos/core#broadMatch>',
                depth: 5,
            },
            type: {
                facetId: 'type',
                predicate:'<http://purl.org/dc/elements/1.1/type> ',
                enabled: true,
                name: 'Tyyppi',
                chart: true,
            },
   /*         concept: {
                facetId: 'concept',
                chart: true,
                predicate:'<http://purl.org/dc/elements/1.1/relation>',
		specifier: '?concept <http://www.w3.org/2004/02/skos/core#closeMatch> ?value',
                specifier: '?value a <http://ldf.fi/snellman/AbstractConcept>/<http://www.w3.org/2004/02/skos/core#exactMatch>/<http://www.w3.org/2004/02/skos/core#Concept>',
                enabled: true,
                name: 'Asia',
		hierarchy: '<http://www.w3.org/2004/02/skos/core#broader>|<http://www.w3.org/2004/02/skos/core#broadMatch>',
            }, */

            concept: {
                facetId: 'concept',
                chart: true,
                predicate:'<http://purl.org/dc/elements/1.1/relation> ',
                specifier: '?value a <http://ldf.fi/snellman/AbstractConcept>',
                enabled: true,
                name: 'Asia',
            }, 

            person: {
                facetId: 'person',
                predicate:'<http://purl.org/dc/elements/1.1/relation> ',
                specifier: '?value a <http://xmlns.com/foaf/0.1/Person>',
                enabled: true,
		chart: true,
                name: 'Henkilö',
            },
            correspondence: {
                facetId: 'correspondence',
                predicate:'<http://ldf.fi/snellman/relatedCorrespondence> ',
                specifier: '?value a <http://ldf.fi/snellman/Correspondence>',
                enabled: true,
                name: 'Kirjeenvaihto',
		chart: true,
            },
            creator: {
                facetId: 'creator',
                predicate:'<http://purl.org/dc/elements/1.1/creator> ',
                enabled: true,
                name: 'Kirjoittaja',
		chart: true,
            }
        };

        var endpointUrl = SPARQL_ENDPOINT_URL;

	//var constraints =
	//' { ?id <http://ldf.fi/relse/personSubject>/^<http://www.w3.org/2002/07/owl#sameAs>/<http://www.w3.org/2004/02/skos/core#prefLabel> ?name .  ' +
	//' ?id <http://ldf.fi/relse/placeObject>/<http://www.w3.org/2004/02/skos/core#prefLabel> ?placeName } ' ;

        var rdfClass = '<http://ldf.fi/snellman/Document>';

        var facetOptions = {
            endpointUrl: endpointUrl, // required
            rdfClass: rdfClass, // optional
            usePost: true,
            preferredLang : 'fi', // required
	    //constraint: constraints //'?id <http://ldf.fi/relse/personSubject>/^<http://www.w3.org/2002/07/owl#sameAs>/<http://www.w3.org/2004/02/skos/core#prefLabel> ?name .  ',
        };

        var prefixes =
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
        ' PREFIX dc: <http://purl.org/dc/elements/1.1/>' +
        ' PREFIX snell: <http://ldf.fi/snellman/>' +
	' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/>';

        var queryTemplate =
        ' SELECT * WHERE {' +
        '  <RESULT_SET> ' +
        '  OPTIONAL { '+
        '   ?id skos:prefLabel ?name . ' +
        '  }' +
        '  OPTIONAL { '+
        '   ?id dc:date ?date . ' +
        '  }' +
        '  OPTIONAL { '+
        '   ?person__id a foaf:Person . ' +
        '   ?id dc:relation ?person__id . ' +
        '   ?person__id skos:prefLabel ?person__label . ' +
        '   OPTIONAL { '+
        '    ?person__id snell:wikidata ?person__match . ' +
        '    }' +
        '   OPTIONAL { '+
        '    ?person__id rdfs:comment ?person__comment . ' +
        '    }' +
        '  }' +
        '  OPTIONAL { '+
        '   ?town__id a snell:Place ; ' +
        '       skos:prefLabel ?town__label . ' +
        '   ?id dc:relation ?town__id . ' +
        '   OPTIONAL { ' +
        '    ?town__id snell:yso ?town__match .' +
        '       } ' +
        '   OPTIONAL { ' +
        '    ?town__id skos:broader ?broader. ' +
        '    ?broader snell:yso ?town__match ' +
        '     }' +
        '   OPTIONAL { ' +
        '    ?town__id skos:broadMatch ?town__match. ' +
        '     }' +
        '    } ' +
        '  OPTIONAL { '+
        '   ?id dc:source ?source . ' +
        '  }' +
        '  OPTIONAL { '+
        '   ?id dc:type ?type . ' +
        '   ?type skos:prefLabel ?typeLabel . ' +
        '  }' +
        '  OPTIONAL { '+
        '   ?concept__id a snell:AbstractConcept ; ' +
        '     skos:prefLabel ?concept__label . ' +
        '   ?id dc:relation ?concept__id . ' +
        '   OPTIONAL { '+
        '    ?concept__id skos:closeMatch ?concept__match . ' +
        '   }' +
        '   OPTIONAL { '+
        '    ?concept__id skos:broadMatch ?concept__match . ' +
        '   }' +
        '   OPTIONAL { '+
        '    ?id rdfs:seeAlso ?bioLink .  ' +
        '   }' +
        '  }' +
        ' }';


        var resultOptions = {
            prefixes: prefixes, // required if the queryTemplate uses prefixes
            queryTemplate: queryTemplate, // required
            resultsPerPage: 20, // optional (default is 10)
            pagesPerQuery: 1, // optional (default is 1)
            paging: true // optional (default is true), if true, enable paging of the results
        };

        var endpointConfig = {
          endpointUrl: endpointUrl,
          usePost: true,
        }

        var resultHandler = new FacetResultHandler(endpointConfig, resultOptions);

        function getResults(facetSelections) {

            return resultHandler.getResults(facetSelections).then(function(pager) {

                return pager.getTotalCount().then(function(count) {
                    pager.totalCount = count;
                    return pager.getPage(0);
                }).then(function() {
                    return pager;
                });
            });
        }

        // Getter for the facet definitions.
        function getFacets() {
            return facets;
        }

        // Getter for the facet options.
        function getFacetOptions() {
            return facetOptions;
        }
    }
})();

