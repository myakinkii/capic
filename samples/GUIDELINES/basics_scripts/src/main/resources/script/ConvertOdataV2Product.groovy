import com.sap.gateway.ip.core.customdev.util.Message;
import groovy.json.JsonSlurper;
import groovy.json.JsonOutput;
import groovy.xml.MarkupBuilder;

def Message transformJson(Message message) {
    
    def json = message.getBody(java.io.Reader);
    def data  = new JsonSlurper().parse(json);

    def products = data.d.results.collect(){ p ->
        p.remove("__metadata")
        [ Product: p ]
    }

    message.setBody("{ \"Products\":"+JsonOutput.toJson(products)+"}");

    return message;
}


def Message transformToXml(Message message) {
    
    def json = message.getBody(java.io.Reader);
    def data  = new JsonSlurper().parse(json);

    def sw = new StringWriter();
    def xml = new MarkupBuilder(sw);

    xml.Products { 
        data.d.results.collect(){ p ->
            p.remove("__metadata")
            xml.Product {
                p.each { prop ->
                    xml."$prop.key"(prop.value)
                }
            }
        }
     }
    
    message.setBody(sw.toString())

    return message;
}
