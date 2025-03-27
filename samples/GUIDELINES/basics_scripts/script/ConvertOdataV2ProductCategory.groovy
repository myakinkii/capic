import com.sap.gateway.ip.core.customdev.util.Message;
import groovy.json.JsonSlurper;
import groovy.xml.MarkupBuilder;

def Message transformToXml(Message message) {
    
    def json = message.getBody(java.io.Reader);
    def data  = new JsonSlurper().parse(json);

    def sw = new StringWriter();
    def xml = new MarkupBuilder(sw);

    xml.ProductCategories { 
        data.d.results.collect(){ p ->
            p.remove("__metadata")
            xml.ProductCategory {
                p.each { prop ->
                    xml."$prop.key"(prop.value)
                }
            }
        }
     }
    
    message.setBody(sw.toString())

    return message;
}
