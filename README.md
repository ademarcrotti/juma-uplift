# Juma Uplift

Juma, jigsaw puzzles for representing mapping, is a method that applies the block metaphor to mapping languages. 

This aplication allows users to create mappings that transform non-RDF data to RDF that are serialized in [R2RML](https://www.w3.org/TR/r2rml/) and [SML](http://sml.aksw.org/).

Find more information about this implementation of the method and the Juma Uplift application in [1] and in http://openscience.adaptcentre.ie/juma/ .

## Using the code
This code was developed using Java 8, maven and a MySQL database.

To execute the application go into project folder using terminal, and run the command mvn jetty:run. The default port is 8080.

Database connections can be modified in src/main/resources/hibernate.cfg.xml

In order to run mappings you need to install the following [R2RML engine] (https://opengogs.adaptcentre.ie/crottija/r2rml) into your maven repository.

## License
Code written by Ademar Crotti Junior.

This study is supported by CNPQ, National Counsel of Technological and Scientific Development – Brazil and the Science Foundation Ireland [ADAPT Centre](https://www.adaptcentre.ie/) for Digital Content Technology (Grant 13/RC/2106) and released under the [MIT license](http://opensource.org/licenses/MIT).

## Publications

[1] A. Crotti Junior, C. Debruyne and D. O'Sullivan. Juma Uplift: Using a Block Metaphor for Representing Uplift Mappings, 2018 IEEE 12th International Conference on Semantic Computing (ICSC), Laguna Hills, CA, 2018, pp. 211-218. doi: 10.1109/ICSC.2018.00037.
