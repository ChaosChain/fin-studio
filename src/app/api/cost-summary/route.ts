import { NextResponse } from 'next/server';
import { costTracker } from '@/lib/cost-tracker';

export async function GET() {
  try {
    const summary = costTracker.getCostSummary();
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching cost summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost summary' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Reset the cost tracker
    costTracker.reset();
    
    return NextResponse.json({ message: 'Cost tracker reset successfully' });
  } catch (error) {
    console.error('Error resetting cost tracker:', error);
    return NextResponse.json(
      { error: 'Failed to reset cost tracker' },
      { status: 500 }
    );
  }
} 