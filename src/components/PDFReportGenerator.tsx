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
      let yPosition = margin;

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
      };

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.35); // Approximate line height
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

      // Detailed Agent Analysis
      workflow.forEach((step, index) => {
        if (step.status === 'completed' && step.result) {
          checkPageBreak(50);
          
          // Agent header
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const agentName = step.agent.replace('-agent', '').replace('-', ' ');
          pdf.text(`${index + 1}. ${agentName.charAt(0).toUpperCase() + agentName.slice(1)} Analysis`, margin, yPosition);
          yPosition += 10;

          // Agent-specific content
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');

          switch (step.agent) {
            case 'market-research-agent':
              if (step.result.analysis) {
                yPosition += addText(`Market Sentiment: ${step.result.analysis.sentiment}`, margin, yPosition, pageWidth - 2 * margin);
                yPosition += 5;
                yPosition += addText(`Confidence Level: ${Math.round((step.result.analysis.confidence || 0) * 100)}%`, margin, yPosition, pageWidth - 2 * margin);
                yPosition += 5;
                if (step.result.analysis.trends) {
                  yPosition += addText(`Key Trends:`, margin, yPosition, pageWidth - 2 * margin);
                  yPosition += 3;
                  step.result.analysis.trends.forEach((trend: string) => {
                    yPosition += addText(`• ${trend}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                    yPosition += 3;
                  });
                }
                yPosition += 5;
                if (step.result.analysis.news_summary) {
                  yPosition += addText(`News Summary: ${step.result.analysis.news_summary}`, margin, yPosition, pageWidth - 2 * margin);
                }
              }
              break;

            case 'macro-research-agent':
              if (step.result.indicators) {
                yPosition += addText('Economic Indicators:', margin, yPosition, pageWidth - 2 * margin);
                yPosition += 5;
                Object.entries(step.result.indicators).forEach(([key, value]) => {
                  const label = key.replace('_', ' ').toUpperCase();
                  yPosition += addText(`• ${label}: ${value}${key.includes('rate') || key.includes('growth') || key.includes('inflation') || key.includes('unemployment') ? '%' : ''}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                  yPosition += 3;
                });
                yPosition += 5;
                if (step.result.analysis) {
                  yPosition += addText(`Analysis: ${step.result.analysis}`, margin, yPosition, pageWidth - 2 * margin);
                  yPosition += 5;
                }
                if (step.result.outlook) {
                  yPosition += addText(`Outlook: ${step.result.outlook.toUpperCase()}`, margin, yPosition, pageWidth - 2 * margin);
                }
              }
              break;

            case 'price-analysis-agent':
              if (step.result.marketData) {
                yPosition += addText('Market Data:', margin, yPosition, pageWidth - 2 * margin);
                yPosition += 5;
                step.result.marketData.forEach((stock: any) => {
                  checkPageBreak(20);
                  yPosition += addText(`${stock.symbol} (${stock.name}):`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                  yPosition += 3;
                  yPosition += addText(`  Price: $${stock.price.toFixed(2)}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                  yPosition += 3;
                  const changeSymbol = stock.change >= 0 ? '+' : '';
                  yPosition += addText(`  Change: ${changeSymbol}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                  yPosition += 3;
                  yPosition += addText(`  Volume: ${stock.volume.toLocaleString()}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                  yPosition += 5;
                });
                
                if (step.result.technicalAnalysis) {
                  yPosition += addText('Technical Analysis:', margin, yPosition, pageWidth - 2 * margin);
                  yPosition += 5;
                  const ta = step.result.technicalAnalysis;
                  yPosition += addText(`• Trend: ${ta.trend}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                  yPosition += 3;
                  yPosition += addText(`• Support Level: $${ta.support}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                  yPosition += 3;
                  yPosition += addText(`• Resistance Level: $${ta.resistance}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                  yPosition += 3;
                  yPosition += addText(`• RSI: ${ta.rsi}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                  yPosition += 3;
                  yPosition += addText(`• Recommendation: ${ta.recommendation.toUpperCase()}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                }
              }
              break;

            case 'insights-agent':
              if (step.result.insight) {
                const insight = step.result.insight;
                yPosition += addText(`Title: ${insight.title}`, margin, yPosition, pageWidth - 2 * margin);
                yPosition += 5;
                yPosition += addText(`Summary: ${insight.summary}`, margin, yPosition, pageWidth - 2 * margin);
                yPosition += 8;
                
                if (insight.sections) {
                  insight.sections.forEach((section: any) => {
                    checkPageBreak(15);
                    yPosition += addText(`${section.title}:`, margin, yPosition, pageWidth - 2 * margin, 11);
                    yPosition += 5;
                    yPosition += addText(section.content, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                    yPosition += 8;
                  });
                }
                
                if (insight.keyPoints) {
                  yPosition += addText('Key Points:', margin, yPosition, pageWidth - 2 * margin, 11);
                  yPosition += 5;
                  insight.keyPoints.forEach((point: string) => {
                    yPosition += addText(`• ${point}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                    yPosition += 3;
                  });
                  yPosition += 5;
                }
                
                if (insight.actionItems) {
                  yPosition += addText('Action Items:', margin, yPosition, pageWidth - 2 * margin, 11);
                  yPosition += 5;
                  insight.actionItems.forEach((item: string) => {
                    yPosition += addText(`• ${item}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
                    yPosition += 3;
                  });
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
              Export Comprehensive Report
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Generate a professional PDF report with all agent analysis
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
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <span>📊</span>
              <span>Export PDF Report</span>
            </>
          )}
        </button>
      </div>
      
      <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
        <p>
          <strong>Report includes:</strong> Executive summary, agent workflow details, market research findings, 
          macroeconomic analysis, technical price analysis, and comprehensive insights with actionable recommendations.
        </p>
      </div>
    </div>
  );
} 