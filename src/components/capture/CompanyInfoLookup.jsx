import React from 'react';
import { InvokeLLM } from "@/api/integrations";

export default class CompanyInfoLookup {
  static async lookupCompanyInfo(companyName) {
    if (!companyName || companyName === "-" || companyName.trim() === "") {
      return null;
    }

    console.log(`Looking up company info for: ${companyName}`);
    
    try {
      // Use LLM integration to find company information from external sources
      const result = await InvokeLLM({
        prompt: `Find information about the Brazilian company "${companyName}". 
                Extract their CNPJ (if available), phone number, and address. 
                If you can't find the information, just return null for any missing field. 
                Do not make up information if not found.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            company_cpfCnpj: {
              type: "string",
              description: "The company's CNPJ number, digits only, no formatting"
            },
            company_phone: {
              type: "string", 
              description: "The company's phone number"
            },
            company_address: {
              type: "string",
              description: "The company's address"
            },
            company_website: {
              type: "string",
              description: "The company's website"
            },
            company_email: {
              type: "string", 
              description: "The company's email"
            },
            confidence: {
              type: "number",
              description: "Confidence score from 0-1 that this information is correct"
            }
          }
        }
      });

      // If no result or very low confidence, return null
      if (!result || result.confidence < 0.3) {
        console.log("No reliable company info found or confidence too low");
        return null;
      }

      console.log("Company info lookup results:", result);
      
      // Clean up the data
      const cleanedResult = {
        ...result,
        company_cpfCnpj: result.company_cpfCnpj ? result.company_cpfCnpj.replace(/\D/g, '') : null,
        company_phone: result.company_phone || null,
        company_address: result.company_address || null,
        company_website: result.company_website || null,
        company_email: result.company_email || null
      };

      return cleanedResult;
    } catch (error) {
      console.error("Error looking up company info:", error);
      return null;
    }
  }

  // Helper method to validate if a CNPJ is valid
  static validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) {
      return false;
    }

    // Check for obvious invalid values
    if (/^(\d)\1+$/.test(cnpj)) {
      return false;
    }

    // CNPJ validation algorithm would go here in a real implementation
    // For now we'll just check length and basic format
    return true;
  }
}