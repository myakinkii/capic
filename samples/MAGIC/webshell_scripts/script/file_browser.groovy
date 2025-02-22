import com.sap.gateway.ip.core.customdev.util.Message
import java.text.SimpleDateFormat

def Message browse(Message message) {
    def mapHeaders = message.getHeaders()
    
    String mainDir = mapHeaders.get("CamelHttpPath") 
    String mainUrl = mapHeaders.get("CamelHttpUrl") 
    String mainSrv = mapHeaders.get("CamelServletContextPath")
    String srvUrl  = mainUrl.minus(mainDir)
    String urlDown = srvUrl.minus(mainSrv)+"/files/download"
    
    SimpleDateFormat sdf= new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
    File dir = new File(mainDir)
    StringBuilder strBuilder = new StringBuilder()
    strBuilder << '<meta charset="UTF-8"></br><table>'
    if (dir.parent != null){strBuilder << "<tr><td><a href='${srvUrl}${dir.parent}'>&#x1F4C1 ..</a></br></td></tr>"}
    dir.eachDir {strBuilder << "<tr><td><a href='${mainUrl}/${it.name}'>&#x1F4C1 ${it.name}</a></td></tr>"}
    dir.eachFile {if (it.isFile()) {strBuilder << "<tr><td><a href='${urlDown}/${mainDir}/${it.name}'>${it.name}</a></td><td> ${it.length()}</td><td> ${sdf.format(new java.util.Date(it.lastModified()))}</td></tr>" }}
    message.setBody(strBuilder.toString().replaceAll("//","/"))
    
    mapHeaders = ['content-type':'text/html']
    message.setHeaders(mapHeaders)
    return message
}

def Message download(Message message) {
    def mapHeaders = message.getHeaders()
    
    String filePath = mapHeaders.get("CamelHttpPath") 
    StringBuilder strBuilder = new StringBuilder()
    
    File file = new File(filePath);byte[] fileContent = file.bytes
    strBuilder << fileContent.encodeBase64().toString()    
    message.setBody(strBuilder.toString());
    
    mapHeaders = ['Content-Transfer-Encoding':'base64',
                  'Content-Disposition':'attachment; filename=${file.getName()}']
                  
                  
    return message
}

