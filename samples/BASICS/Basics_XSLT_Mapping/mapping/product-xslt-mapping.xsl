<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:cpi="http://sap.com/it/" exclude-result-prefixes="cpi" version="2.0">

<!-- include exchange parameter -->
  <xsl:param name="exchange"/>
<!-- define property quantity -->
  <xsl:param name="quantity"/>
<!-- define property orderId -->
  <xsl:param name="orderId"/>
  
  <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:strip-space elements="*"/>

  <xsl:template match="@* | node()">
    <xsl:apply-templates select="@* | node()"/>
  </xsl:template>

  <xsl:template match="/">
<!-- set headers -->
    <xsl:value-of select="cpi:setHeader($exchange, 'context', 'ModelingBasics-HeaderPropertiesInXSLT')"/>
    <xsl:value-of select="cpi:setHeader($exchange, 'content-type', 'application/xml')"/>
    <xsl:element name="PurchaseOrder">
      <xsl:element name="PurchaseOrderNumber">
<!-- use header orderid -->
        <xsl:value-of select="$orderId"/>
      </xsl:element>
      <xsl:element name="Items">
        <xsl:for-each select="/Products/Product">
          <xsl:call-template name="Order_Items"/>
        </xsl:for-each>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <xsl:template name="Order_Items">
    <xsl:element name="Item">
      <xsl:element name="ProductId">
        <xsl:value-of select="./ProductId"/>
      </xsl:element>
      <xsl:element name="ProductName">
        <xsl:value-of select="./Name"/>
      </xsl:element>
      <xsl:element name="Category">
        <xsl:value-of select="./Category"/>
      </xsl:element>
      <xsl:element name="Quantity">
<!-- use property quantity -->
        <xsl:value-of select="$quantity"/>
      </xsl:element>
      <xsl:element name="Price">
        <xsl:value-of select="./Price * $quantity"/>
      </xsl:element>
      <xsl:element name="Currency">
        <xsl:value-of select="./CurrencyCode"/>
      </xsl:element>
    </xsl:element>
  </xsl:template>

</xsl:stylesheet>