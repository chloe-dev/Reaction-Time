/**
 * The MIT License
 *
 * Copyright © 2025, Chloe B.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Reaction Assessment by Chloe B.
 */

const ASSESSMENT_CONFIGURATION = {
    TOTAL_STAGES: 5,
    STRIKES_LIMIT: 3,
    DELAY_INTERVALS: {
        MINIMUM_MS: 1000,
        MAXIMUM_MS: 5000
    },

    COLORS: {
        DEFAULT: {
            BACKGROUND: "#7F7FFF",
            TEXT: "#000000"
        },
        AWAITING_STIMULUS: {
            BACKGROUND: "#BF1F1F",
            TEXT: "#000000"
        },
        AWAITING_RESPONSE: {
            BACKGROUND: "#1FBF1F",
            TEXT: "#000000"
        },
        DISPLAYING_STRIKE: {
            BACKGROUND: "#FF7F00",
            TEXT: "#000000"
        },
        DISPLAYING_FAILURE: {
            BACKGROUND: "#FF1F1F",
            TEXT: "#000000"
        }
    },
} as const;

enum AssessmentState {
    AWAITING_START = 0,
    AWAITING_STIMULUS = 1,
    AWAITING_RESPONSE = 2,
    DISPLAYING_STAGE = 3,
    DISPLAYING_STRIKE = 4,
    DISPLAYING_FAILURE = 5,
    DISPLAYING_RESULTS = 6
}

interface AssessmentElements {
    container: HTMLElement;
    currentStage: HTMLElement;
    lastAverage: HTMLElement;
    bestAverage: HTMLElement;
}

interface AssessmentStatistics {
    stage: number;
    strikes: number;
    results: number[];

    timerStart: number;

    lastAverage: number | null;
    bestAverage: number | null;
}

class ReactionAssessment {
    private state: AssessmentState;
    private elements: AssessmentElements;
    private statistics: AssessmentStatistics;

    private waitTimeout: number | null;

    constructor() {
        this.state = AssessmentState.AWAITING_START;

        this.elements = this.initializeAssessmentElements();
        this.statistics = this.initializeAssessmentStatistics();

        this.waitTimeout = null;

        this.bindMouseEvent();

        this.updateDisplay();
    }

    private initializeAssessmentElements(): AssessmentElements {
        const container = document.getElementById("reaction-assessment");
        const currentStage = document.getElementById("reaction-assessment-stage");
        const lastAverage = document.getElementById("reaction-assessment-last-average");
        const bestAverage = document.getElementById("reaction-assessment-best-average");

        if (!container || !currentStage || !lastAverage || !bestAverage) {
            throw new Error("[REACTION-ASSESSMENT]: Required assessment elements were not found.");
        }

        return { container, currentStage, lastAverage, bestAverage };
    }

    private initializeAssessmentStatistics(): AssessmentStatistics {
        return { stage: 1, strikes: 0, results: [], timerStart: 0, lastAverage: null, bestAverage: null };
    }

    private bindMouseEvent(): void {
        this.elements.container.addEventListener("mousedown", this.handleClick.bind(this));
    }

    private handleClick(): void {
        const handlers: Record<AssessmentState, () => void> = {
            [AssessmentState.AWAITING_START]: () => this.handleAwaitingStart(),
            [AssessmentState.AWAITING_STIMULUS]: () => this.handleAwaitingStimulus(),
            [AssessmentState.AWAITING_RESPONSE]: () => this.handleAwaitingResponse(),
            [AssessmentState.DISPLAYING_STAGE]: () => this.continueAssessment(),
            [AssessmentState.DISPLAYING_STRIKE]: () => this.continueAssessment(),
            [AssessmentState.DISPLAYING_FAILURE]: () => this.resetAssessment(),
            [AssessmentState.DISPLAYING_RESULTS]: () => this.resetAssessment()
        };

        handlers[this.state]();
    }

    private handleAwaitingStart(): void {
        this.state = AssessmentState.AWAITING_STIMULUS;

        this.updateDisplay();
    }

    private handleAwaitingStimulus(): void {
        if (this.waitTimeout) {
            clearTimeout(this.waitTimeout);
        }

        ++this.statistics.strikes;

        if (this.statistics.strikes === ASSESSMENT_CONFIGURATION.STRIKES_LIMIT) {
            this.state = AssessmentState.DISPLAYING_FAILURE;
            this.resetAssessmentStatistics();
        } else {
            this.state = AssessmentState.DISPLAYING_STRIKE;
        }

        this.updateDisplay();
    }

    private handleAwaitingResponse(): void {
        const reactionTimeInMillis = performance.now() - this.statistics.timerStart;

        this.statistics.results.push(reactionTimeInMillis);

        if (this.statistics.stage < ASSESSMENT_CONFIGURATION.TOTAL_STAGES) {
            this.state = AssessmentState.DISPLAYING_STAGE;

            this.updateDisplay();

            ++this.statistics.stage;
        } else {
            this.calculateResults();

            this.state = AssessmentState.DISPLAYING_RESULTS;

            this.updateDisplay();
        }
    }

    private continueAssessment(): void {
        this.state = AssessmentState.AWAITING_STIMULUS;

        this.updateDisplay();
    }

    private resetAssessment(): void {
        this.resetAssessmentStatistics();
        this.state = AssessmentState.AWAITING_STIMULUS;
        this.updateDisplay();
    }

    private calculateResults(): void {
        this.statistics.lastAverage = Math.round(
            this.statistics.results.reduce(
                (accumulator, currentValue) => accumulator + currentValue, 0
            ) / this.statistics.results.length
        );

        if (!this.statistics.bestAverage || this.statistics.lastAverage < this.statistics.bestAverage) {
            this.statistics.bestAverage = this.statistics.lastAverage;
        }
    }

    private resetAssessmentStatistics(): void {
        this.statistics.stage = 1;
        this.statistics.strikes = 0;
        this.statistics.results = [];
        this.statistics.timerStart = 0;
    }

    private updateDisplay(): void {
        const displays: Record<AssessmentState, () => void> = {
            [AssessmentState.AWAITING_START]: () => this.displayAwaitingStart(),
            [AssessmentState.AWAITING_STIMULUS]: () => this.displayAwaitingStimulus(),
            [AssessmentState.AWAITING_RESPONSE]: () => this.displayAwaitingResponse(),
            [AssessmentState.DISPLAYING_STAGE]: () => this.displayStage(),
            [AssessmentState.DISPLAYING_STRIKE]: () => this.displayStrike(),
            [AssessmentState.DISPLAYING_FAILURE]: () => this.displayFailure(),
            [AssessmentState.DISPLAYING_RESULTS]: () => this.displayResults()
        };

        displays[this.state]();
    }

    private updateElementStyle(backgroundColor: string, textColor: string, content: string): void {
        this.elements.container.style.backgroundColor = backgroundColor;
        this.elements.container.style.color = textColor;
        this.elements.container.textContent = content;
    }

    private displayAwaitingStart(): void {
        this.updateElementStyle(
            ASSESSMENT_CONFIGURATION.COLORS.DEFAULT.BACKGROUND,
            ASSESSMENT_CONFIGURATION.COLORS.DEFAULT.TEXT,
            "Click to Start"
        );

        this.elements.currentStage.textContent = "STAGE ─ ...";
    }

    private displayAwaitingStimulus(): void {
        this.updateElementStyle(
            ASSESSMENT_CONFIGURATION.COLORS.AWAITING_STIMULUS.BACKGROUND,
            ASSESSMENT_CONFIGURATION.COLORS.AWAITING_STIMULUS.TEXT,
            "..."
        );

        this.elements.currentStage.textContent = `STAGE ─ ${this.statistics.stage} / 5`;

        const delayInMilliseconds = Math.random()
            * (ASSESSMENT_CONFIGURATION.DELAY_INTERVALS.MAXIMUM_MS - ASSESSMENT_CONFIGURATION.DELAY_INTERVALS.MINIMUM_MS)
            + ASSESSMENT_CONFIGURATION.DELAY_INTERVALS.MINIMUM_MS;

        this.waitTimeout = window.setTimeout(() => {
            this.state = AssessmentState.AWAITING_RESPONSE;
            this.updateDisplay();
        }, delayInMilliseconds);
    }

    private displayAwaitingResponse(): void {
        this.updateElementStyle(
            ASSESSMENT_CONFIGURATION.COLORS.AWAITING_RESPONSE.BACKGROUND,
            ASSESSMENT_CONFIGURATION.COLORS.AWAITING_RESPONSE.TEXT,
            "Click!"
        );

        this.statistics.timerStart = performance.now();
    }

    private displayStage(): void {
        this.updateElementStyle(
            ASSESSMENT_CONFIGURATION.COLORS.DEFAULT.BACKGROUND,
            ASSESSMENT_CONFIGURATION.COLORS.DEFAULT.TEXT,
            `${this.statistics.results[this.statistics.stage - 1]} ms\n\nClick to Continue`
        )
    }

    private displayStrike(): void {
        this.updateElementStyle(
            ASSESSMENT_CONFIGURATION.COLORS.DISPLAYING_STRIKE.BACKGROUND,
            ASSESSMENT_CONFIGURATION.COLORS.DISPLAYING_STRIKE.TEXT,
            `Strike ${this.statistics.strikes} / 3`
        );
    }

    private displayFailure(): void {
        this.updateElementStyle(
            ASSESSMENT_CONFIGURATION.COLORS.DISPLAYING_FAILURE.BACKGROUND,
            ASSESSMENT_CONFIGURATION.COLORS.DISPLAYING_FAILURE.TEXT,
            "Strike 3 / 3\n\nClick to Restart"
        )

        this.elements.lastAverage.textContent = "LAST ─ ...";
    }

    private displayResults(): void {
        this.updateElementStyle(
            ASSESSMENT_CONFIGURATION.COLORS.DEFAULT.BACKGROUND,
            ASSESSMENT_CONFIGURATION.COLORS.DEFAULT.TEXT,
            `Average ─ ${this.statistics.lastAverage} ms\n\nClick to Restart`
        );

        this.elements.lastAverage.textContent = this.statistics.lastAverage ?
            `LAST ─ ${this.statistics.lastAverage} ms` : "...";

        this.elements.bestAverage.textContent = this.statistics.bestAverage ?
            `BEST ─ ${this.statistics.bestAverage} ms` : "...";
    }
}

document.addEventListener("DOMContentLoaded", () => new ReactionAssessment());