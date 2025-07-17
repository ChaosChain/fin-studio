'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';

interface WorkflowStep {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  duration?: number;
}

interface PDFReportGeneratorProps {
  workflow: WorkflowStep[];
  symbols: string[];
}

export function PDFReportGenerator({ workflow, symbols }: PDFReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const bottomMargin = 30; // Add bottom margin
      let yPosition = margin;

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin - bottomMargin) {
          pdf.addPage();
          yPosition = margin;
        }
      };

      // Helper function to clean and format text
      const cleanText = (text: string): string => {
        if (!text) return '';
        
        return text
          .replace(/\*\*/g, '') // Remove markdown bold markers
          .replace(/\*/g, '') // Remove markdown italic markers
          .replace(/--/g, '') // Remove separators
          .replace(/\n+/g, ' ') // Replace multiple newlines with single space
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
      };

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.35); // Approximate line height
      };

      // Helper function to add section header
      const addSectionHeader = (text: string, y: number) => {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(text, margin, y);
        return 8; // Return height used
      };

      // Helper function to add subsection
      const addSubsection = (text: string, y: number, indent: number = 5) => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(text, margin + indent, y);
        return 6;
      };

      // Helper function to add content
      const addContent = (text: string, y: number, indent: number = 10) => {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const cleanedText = cleanText(text);
        return addText(cleanedText, margin + indent, y, pageWidth - 2 * margin - indent);
      };

      // Helper function to add bullet points
      const addBulletPoints = (points: string[], y: number, indent: number = 15) => {
        let currentY = y;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        points.forEach(point => {
          const cleanedPoint = cleanText(point);
          if (cleanedPoint) {
            const lines = pdf.splitTextToSize(`• ${cleanedPoint}`, pageWidth - 2 * margin - indent);
            pdf.text(lines, margin + indent, currentY);
            currentY += lines.length * 3.5;
          }
        });
        
        return currentY - y;
      };

      // Helper function to check if content is empty or meaningless
      const isEmptyContent = (content: any): boolean => {
        if (content === null || content === undefined || content === '') {
          return true;
        }
        if (typeof content === 'string') {
          const trimmed = content.trim();
          return trimmed === '' || trimmed === 'N/A' || trimmed === 'None' || trimmed === 'null';
        }
        if (Array.isArray(content)) {
          return content.length === 0 || content.every(item => isEmptyContent(item));
        }
        if (typeof content === 'object') {
          return Object.keys(content).length === 0 || 
                 Object.values(content).every(value => isEmptyContent(value));
        }
        return false;
      };

      // Helper function to add structured content with proper formatting
      const addStructuredContent = (content: any, y: number, indent: number = 10) => {
        let currentY = y;
        
        if (typeof content === 'string') {
          if (!isEmptyContent(content)) {
            currentY += addContent(content, currentY, indent);
          }
        } else if (Array.isArray(content)) {
          const nonEmptyItems = content.filter(item => !isEmptyContent(item));
          if (nonEmptyItems.length > 0) {
            currentY += addBulletPoints(nonEmptyItems, currentY, indent);
          }
        } else if (typeof content === 'object' && content !== null) {
          Object.entries(content).forEach(([key, value]) => {
            if (!isEmptyContent(value)) {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              currentY += addSubsection(label, currentY, indent);
              currentY += 3;
              
              if (typeof value === 'string') {
                currentY += addContent(value, currentY, indent + 5);
              } else if (Array.isArray(value)) {
                const nonEmptyItems = value.filter(item => !isEmptyContent(item));
                if (nonEmptyItems.length > 0) {
                  currentY += addBulletPoints(nonEmptyItems, currentY, indent + 5);
                }
              } else if (typeof value === 'object' && value !== null) {
                currentY += addStructuredContent(value, currentY, indent + 5);
              }
              currentY += 3;
            }
          });
        }
        
        return currentY - y;
      };

      // Helper function to add clean section content
      const addCleanSection = (sectionName: string, content: any, y: number) => {
        let currentY = y;
        
        // Add section header
        currentY += addSectionHeader(sectionName, currentY);
        currentY += 5;
        
        // Add cleaned content
        if (typeof content === 'string') {
          currentY += addContent(content, currentY);
        } else if (Array.isArray(content)) {
          currentY += addBulletPoints(content, currentY);
        } else if (typeof content === 'object') {
          currentY += addStructuredContent(content, currentY);
        }
        currentY += 8;
        
        return currentY - y;
      };

      // Header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fin Studio - A2A Agent Analysis Report', margin, yPosition);
      yPosition += 15;

      // Date and symbols
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Analyzed Symbols: ${symbols.join(', ')}`, margin, yPosition);
      yPosition += 15;

      // Executive Summary
      checkPageBreak(30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const summaryText = `This report presents a comprehensive analysis conducted by our AI-powered A2A (Agent-to-Agent) financial analysis platform. Four specialized agents collaborated to provide market research, macroeconomic analysis, technical price analysis, and synthesized insights for the selected securities.`;
      yPosition += addText(summaryText, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;

      // Workflow Overview
      checkPageBreak(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Agent Workflow Overview', margin, yPosition);
      yPosition += 10;

      // Workflow summary table
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      workflow.forEach((step, index) => {
        checkPageBreak(15);
        const agentName = step.agent.replace('-agent', '').replace('-', ' ').toUpperCase();
        const status = step.status === 'completed' ? '✓ COMPLETED' : step.status.toUpperCase();
        const duration = step.duration ? `${step.duration}ms` : 'N/A';
        
        pdf.text(`${index + 1}. ${agentName}`, margin, yPosition);
        pdf.text(`${status}`, margin + 80, yPosition);
        pdf.text(`${duration}`, margin + 130, yPosition);
        yPosition += 6;
      });
      yPosition += 10;

      // Detailed Agent Analysis with clean content
      workflow.forEach((step, index) => {
        if (step.status === 'completed' && step.result) {
          checkPageBreak(50);
          
          // Agent header
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const agentName = step.agent.replace('-agent', '').replace('-', ' ');
          pdf.text(`${index + 1}. ${agentName.charAt(0).toUpperCase() + agentName.slice(1)} Analysis`, margin, yPosition);
          yPosition += 10;

          // Agent-specific content with clean formatting
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');

          switch (step.agent) {
            case 'market-research-agent':
              if (step.result) {
                // Market Sentiment
                if (!isEmptyContent(step.result.sentiment) || !isEmptyContent(step.result.analysis?.sentiment)) {
                  const sentimentData = step.result.analysis?.sentiment || step.result.sentiment;
                  yPosition += addCleanSection('Market Sentiment', sentimentData, yPosition);
                }

                // Confidence Level
                if (!isEmptyContent(step.result.confidence) || !isEmptyContent(step.result.analysis?.confidence)) {
                  const confidenceData = step.result.analysis?.confidence || step.result.confidence;
                  yPosition += addCleanSection('Confidence Level', `${Math.round(confidenceData * 100)}%`, yPosition);
                }

                // Key Trends
                if (step.result.analysis?.trends && Array.isArray(step.result.analysis.trends) && !isEmptyContent(step.result.analysis.trends)) {
                  yPosition += addCleanSection('Key Trends', step.result.analysis.trends, yPosition);
                }

                // News Summary
                if (!isEmptyContent(step.result.analysis?.news_summary)) {
                  yPosition += addCleanSection('News Summary', step.result.analysis.news_summary, yPosition);
                }

                // Technical Analysis
                if (!isEmptyContent(step.result.analysis?.technicalAnalysis)) {
                  yPosition += addCleanSection('Technical Analysis', step.result.analysis.technicalAnalysis, yPosition);
                }

                // Risk Assessment
                if (!isEmptyContent(step.result.analysis?.riskAssessment)) {
                  yPosition += addCleanSection('Risk Assessment', step.result.analysis.riskAssessment, yPosition);
                }

                // Recommendations
                if (!isEmptyContent(step.result.recommendations) || !isEmptyContent(step.result.analysis?.recommendations)) {
                  const recommendationsData = step.result.analysis?.recommendations || step.result.recommendations;
                  yPosition += addCleanSection('Investment Recommendations', recommendationsData, yPosition);
                }
              }
              break;

            case 'macro-research-agent':
              if (step.result) {
                // Economic Indicators
                if (!isEmptyContent(step.result.indicators)) {
                  yPosition += addCleanSection('Economic Indicators', step.result.indicators, yPosition);
                }

                // Macroeconomic Analysis
                if (!isEmptyContent(step.result.analysis)) {
                  yPosition += addCleanSection('Macroeconomic Analysis', step.result.analysis, yPosition);
                }

                // Regions Analyzed
                if (step.result.regions && !isEmptyContent(step.result.regions)) {
                  yPosition += addCleanSection('Regions Analyzed', step.result.regions, yPosition);
                }

                // Key Insights
                if (!isEmptyContent(step.result.keyInsights)) {
                  yPosition += addCleanSection('Key Insights', step.result.keyInsights, yPosition);
                }

                // Risk Factors
                if (!isEmptyContent(step.result.riskFactors)) {
                  yPosition += addCleanSection('Risk Factors', step.result.riskFactors, yPosition);
                }
              }
              break;

            case 'price-analysis-agent':
              if (step.result) {
                // Executive Summary
                if (!isEmptyContent(step.result.executiveSummary)) {
                  yPosition += addCleanSection('Price Analysis Summary', step.result.executiveSummary, yPosition);
                }

                // Real-time Price Analysis
                if (!isEmptyContent(step.result.analysis?.realTimePriceAnalysis)) {
                  yPosition += addCleanSection('Real-time Price Analysis', step.result.analysis.realTimePriceAnalysis, yPosition);
                }

                // Technical Indicators
                if (!isEmptyContent(step.result.analysis?.technicalIndicators)) {
                  yPosition += addCleanSection('Technical Indicators', step.result.analysis.technicalIndicators, yPosition);
                }

                // Chart Pattern Analysis
                if (!isEmptyContent(step.result.analysis?.chartPatternAnalysis)) {
                  yPosition += addCleanSection('Chart Pattern Analysis', step.result.analysis.chartPatternAnalysis, yPosition);
                }

                // Volume and Flow Analysis
                if (!isEmptyContent(step.result.analysis?.volumeFlowAnalysis)) {
                  yPosition += addCleanSection('Volume and Flow Analysis', step.result.analysis.volumeFlowAnalysis, yPosition);
                }

                // Volatility Analysis
                if (!isEmptyContent(step.result.analysis?.volatilityAnalysis)) {
                  yPosition += addCleanSection('Volatility Analysis', step.result.analysis.volatilityAnalysis, yPosition);
                }

                // Market Microstructure
                if (!isEmptyContent(step.result.analysis?.marketMicrostructure)) {
                  yPosition += addCleanSection('Market Microstructure', step.result.analysis.marketMicrostructure, yPosition);
                }

                // Risk Metrics
                if (!isEmptyContent(step.result.analysis?.riskMetrics)) {
                  yPosition += addCleanSection('Risk Metrics', step.result.analysis.riskMetrics, yPosition);
                }

                // Trading Implications
                if (!isEmptyContent(step.result.analysis?.tradingImplications)) {
                  yPosition += addCleanSection('Trading Implications', step.result.analysis.tradingImplications, yPosition);
                }

                // Price Targets
                if (!isEmptyContent(step.result.analysis?.priceTargets)) {
                  yPosition += addCleanSection('Price Targets', step.result.analysis.priceTargets, yPosition);
                }

                // Confidence Level
                if (!isEmptyContent(step.result.analysis?.confidenceLevel)) {
                  yPosition += addCleanSection('Confidence Level', step.result.analysis.confidenceLevel.toString(), yPosition);
                }
              }
              break;

            case 'insights-agent':
              if (step.result) {
                // Market Insights
                if (!isEmptyContent(step.result.insights)) {
                  yPosition += addCleanSection('Market Insights', step.result.insights, yPosition);
                }

                // Daily Market Analysis
                if (step.result.keyPoints && Array.isArray(step.result.keyPoints) && !isEmptyContent(step.result.keyPoints)) {
                  yPosition += addCleanSection('Daily Market Analysis', step.result.keyPoints, yPosition);
                }

                // Market Outlook
                if (!isEmptyContent(step.result.marketOutlook)) {
                  yPosition += addCleanSection('Market Outlook', step.result.marketOutlook, yPosition);
                }

                // Investment Strategy
                if (!isEmptyContent(step.result.investmentStrategy)) {
                  yPosition += addCleanSection('Investment Strategy', step.result.investmentStrategy, yPosition);
                }

                // Portfolio Allocation
                if (!isEmptyContent(step.result.portfolioAllocation)) {
                  yPosition += addCleanSection('Portfolio Allocation', step.result.portfolioAllocation, yPosition);
                }

                // Recommendations
                if (step.result.recommendations && Array.isArray(step.result.recommendations) && !isEmptyContent(step.result.recommendations)) {
                  yPosition += addCleanSection('Investment Recommendations', step.result.recommendations, yPosition);
                }

                // Risk Factors
                if (step.result.riskFactors && Array.isArray(step.result.riskFactors) && !isEmptyContent(step.result.riskFactors)) {
                  yPosition += addCleanSection('Risk Factors', step.result.riskFactors, yPosition);
                }

                // Market Timing
                if (!isEmptyContent(step.result.marketTiming)) {
                  yPosition += addCleanSection('Market Timing', step.result.marketTiming, yPosition);
                }
              }
              break;
          }
          yPosition += 15;
        }
      });

      // Footer
      checkPageBreak(30);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Generated by Fin Studio A2A Agent Platform', margin, yPosition);
      yPosition += 5;
      pdf.text('This report is for informational purposes only and should not be considered as investment advice.', margin, yPosition);

      // Save the PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `FinStudio_A2A_Report_${symbols.join('_')}_${timestamp}.pdf`;
      pdf.save(filename);

      console.log(`📄 PDF Report generated: ${filename}`);
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const isWorkflowCompleted = workflow.length > 0 && workflow.every(step => step.status === 'completed');

  if (!isWorkflowCompleted) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">📄</span>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-400">
              Export Clean Report
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Generate a professional PDF report with clean formatting
            </p>
          </div>
        </div>
        
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
        >
          {isGenerating ? (
            <>
              <div className="loading-spinner h-4 w-4"></div>
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <span>📊</span>
              <span>Export Clean Report</span>
            </>
          )}
        </button>
      </div>
      
      <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
        <p>
          <strong>Clean report includes:</strong> Direct agent content with proper formatting, 
          clean syntax, and well-aligned layout for professional presentation.
        </p>
      </div>
    </div>
  );
} 