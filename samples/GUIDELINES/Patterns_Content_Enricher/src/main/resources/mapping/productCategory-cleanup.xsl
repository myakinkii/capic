<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output indent="yes"/>
    <xsl:strip-space elements="*"/>
    
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
            <xsl:if test="ProductCategory/MainCategoryName">
                <MainCategoryName><xsl:value-of select="ProductCategory/MainCategoryName" /></MainCategoryName>
            </xsl:if>
        </xsl:copy>
    </xsl:template>
    
    <xsl:template match="Items/Item/ProductCategory"/>
    
</xsl:stylesheet>