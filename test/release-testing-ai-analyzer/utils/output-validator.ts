/**
 * Validates the quality and completeness of generated testing plans
 */

import type { TestingPlan, TestingScenario } from '../types';

export type ValidationResult = {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  strengths: string[];
};

export class OutputValidator {
  /**
   * Validates a generated testing plan
   *
   * @param plan
   */
  validatePlan(plan: TestingPlan): ValidationResult {
    const issues: string[] = [];
    const strengths: string[] = [];
    let score = 100;

    const allScenarios = [
      ...plan.testScenarios.cherryPickScenarios,
      ...plan.testScenarios.initialScenarios,
    ];

    // Check basic structure
    if (allScenarios.length > 0) {
      strengths.push(`Generated ${allScenarios.length} testing scenarios`);
    } else {
      issues.push('No testing scenarios generated');
      score -= 50;
    }

    // Check summary statistics
    if (plan.summary) {
      const { highRiskScenarios, mediumRiskScenarios, riskScore } =
        plan.summary;
      const totalScenarios = highRiskScenarios + mediumRiskScenarios;

      if (totalScenarios !== allScenarios.length) {
        issues.push(
          `Summary counts (${totalScenarios}) don't match scenario count (${allScenarios.length})`,
        );
        score -= 5;
      }

      if (highRiskScenarios === 0 && allScenarios.length > 5) {
        issues.push(
          'No high-risk scenarios identified despite significant changes',
        );
        score -= 10;
      } else if (highRiskScenarios > 0) {
        strengths.push(`Identified ${highRiskScenarios} high-risk scenarios`);
      }

      if (typeof riskScore === 'number') {
        strengths.push(`Risk score: ${riskScore}/100`);
      }
    } else {
      issues.push('Missing summary statistics');
      score -= 10;
    }

    // Validate each scenario
    allScenarios.forEach((scenario, index) => {
      const scenarioIssues = this.validateScenario(scenario, index);
      issues.push(...scenarioIssues);
      if (scenarioIssues.length > 0) {
        score -= 2 * scenarioIssues.length;
      }
    });

    // Check for coverage of critical areas
    const criticalAreas = this.checkCriticalAreaCoverage(allScenarios);
    if (criticalAreas.missing.length > 0) {
      issues.push(
        `Missing coverage for critical areas: ${criticalAreas.missing.join(', ')}`,
      );
      score -= 5 * criticalAreas.missing.length;
    } else {
      strengths.push('Good coverage of critical areas');
    }

    // Check scenario quality
    const qualityMetrics = this.assessScenarioQuality(allScenarios);
    if (qualityMetrics.averageSteps < 2) {
      issues.push('Scenarios have insufficient test steps (average < 2)');
      score -= 10;
    } else {
      strengths.push(
        `Good test step detail (average ${qualityMetrics.averageSteps.toFixed(1)} steps per scenario)`,
      );
    }

    // Check for diversity in risk levels
    const riskDistribution = this.checkRiskDistribution(allScenarios);
    if (riskDistribution.allSame && allScenarios.length > 3) {
      issues.push(
        'All scenarios have the same risk level - may need more nuanced analysis',
      );
      score -= 5;
    } else {
      strengths.push('Good risk level distribution');
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      isValid: score >= 70 && issues.length < allScenarios.length,
      score,
      issues,
      strengths,
    };
  }

  /**
   * Validates a single testing scenario
   *
   * @param scenario
   * @param index
   */
  private validateScenario(scenario: TestingScenario, index: number): string[] {
    const issues: string[] = [];

    if (!scenario.area || scenario.area.trim().length === 0) {
      issues.push(`Scenario ${index + 1}: Missing area`);
    }

    if (!scenario.testSteps || scenario.testSteps.length === 0) {
      issues.push(`Scenario ${index + 1}: No test steps provided`);
    } else if (scenario.testSteps.length < 2) {
      issues.push(
        `Scenario ${index + 1}: Insufficient test steps (need at least 2)`,
      );
    }

    if (
      !scenario.whyThisMatters ||
      scenario.whyThisMatters.trim().length < 20
    ) {
      issues.push(
        `Scenario ${index + 1}: "Why This Matters" too short or missing`,
      );
    }

    if (!['high', 'medium'].includes(scenario.riskLevel)) {
      issues.push(
        `Scenario ${index + 1}: Invalid risk level (must be high or medium)`,
      );
    }

    return issues;
  }

  /**
   * Checks if critical areas are covered
   *
   * @param scenarios
   */
  private checkCriticalAreaCoverage(scenarios: TestingScenario[]): {
    covered: string[];
    missing: string[];
  } {
    const criticalAreas = [
      'state migration',
      'controller',
      'transaction',
      'security',
      'migration',
    ];

    const coveredAreas = new Set<string>();
    scenarios.forEach((scenario) => {
      const areaLower = scenario.area.toLowerCase();
      criticalAreas.forEach((critical) => {
        if (areaLower.includes(critical)) {
          coveredAreas.add(critical);
        }
      });
    });

    const covered = Array.from(coveredAreas);
    const missing = criticalAreas.filter((area) => !coveredAreas.has(area));

    return { covered, missing };
  }

  /**
   * Assesses the quality of scenarios
   *
   * @param scenarios
   */
  private assessScenarioQuality(scenarios: TestingScenario[]): {
    averageSteps: number;
    averageWhyThisMattersLength: number;
  } {
    if (scenarios.length === 0) {
      return {
        averageSteps: 0,
        averageWhyThisMattersLength: 0,
      };
    }

    const totalSteps = scenarios.reduce(
      (sum, s) => sum + (s.testSteps?.length || 0),
      0,
    );
    const totalWhyThisMattersLength = scenarios.reduce(
      (sum, s) => sum + (s.whyThisMatters?.length || 0),
      0,
    );

    return {
      averageSteps: totalSteps / scenarios.length,
      averageWhyThisMattersLength: totalWhyThisMattersLength / scenarios.length,
    };
  }

  /**
   * Checks risk level distribution
   *
   * @param scenarios
   */
  private checkRiskDistribution(scenarios: TestingScenario[]): {
    high: number;
    medium: number;
    allSame: boolean;
  } {
    const distribution = {
      high: 0,
      medium: 0,
    };

    scenarios.forEach((scenario) => {
      if (scenario.riskLevel === 'high' || scenario.riskLevel === 'medium') {
        distribution[scenario.riskLevel] += 1;
      }
    });

    const allSame =
      Object.values(distribution).filter((count) => count > 0).length === 1;

    return { ...distribution, allSame };
  }
}
