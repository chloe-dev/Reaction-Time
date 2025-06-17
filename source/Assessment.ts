/**
 * Copyright (c) 2025, Chloe B., Reaction-Time.
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
 * Reaction-Time Assessment by Chloe B.
 * v1.0.0 (Major, Minor, Patch).
 */

type DisplayStyle = {
    backgroundColor: string;
    textColor: string;
}

type DisplayStyles = {
    DEFAULT: DisplayStyle;
    AWAITING_STIMULUS: DisplayStyle;
    AWAITING_RESPONSE: DisplayStyle;
    DISPLAYING_STRIKE: DisplayStyle;
    DISPLAYING_FAILURE: DisplayStyle;
}

enum DisplayState {
    "AWAITING_START" = "AWAITING_START",
    "AWAITING_STIMULUS" = "AWAITING_STIMULUS",
    "AWAITING_RESPONSE" = "AWAITING_RESPONSE",
    "DISPLAYING_STAGE" = "DISPLAYING_STAGE",
    "DISPLAYING_STRIKE" = "DISPLAYING_STRIKE",
    "DISPLAYING_FAILURE" = "DISPLAYING_FAILURE",
    "DISPLAYING_RESULTS" = "DISPLAYING_RESULTS"
}

enum AssessmentState {
    "AWAITING_START" = "AWAITING_START",
    "AWAITING_STIMULUS" = "AWAITING_STIMULUS",
    "AWAITING_RESPONSE" = "AWAITING_RESPONSE",
    "AWAITING_CONTINUE" = "AWAITING_CONTINUE",
    "AWAITING_RESTART" = "AWAITING_RESTART"
}

class Assessment {
    private readonly inputStateHandlers: Record<AssessmentState, () => void> = {
        [AssessmentState.AWAITING_START]: () => this.startAssessment(),
        [AssessmentState.AWAITING_STIMULUS]: () => this.handleStrike(),
        [AssessmentState.AWAITING_RESPONSE]: () => this.handleResponse(),
        [AssessmentState.AWAITING_CONTINUE]: () => this.continueAssessment(),
        [AssessmentState.AWAITING_RESTART]: () => this.restartAssessment()
    }

    private startAssessment(): void {
        this.assessmentState = AssessmentState.AWAITING_STIMULUS;
        this.displayState = DisplayState.AWAITING_STIMULUS;
        this.updateDisplayState();
    }

    private handleStrike(): void {
        if (this.waitTimeoutMs !== null) {
            clearTimeout(this.waitTimeoutMs);
            this.waitTimeoutMs = null;
        }

        if (++this.strikes >= this.strikesLimit) {
            this.assessmentState = AssessmentState.AWAITING_RESTART;
            this.displayState = DisplayState.DISPLAYING_FAILURE;
        } else {
            this.assessmentState = AssessmentState.AWAITING_CONTINUE;
            this.displayState = DisplayState.DISPLAYING_STRIKE;
        }

        this.updateDisplayState();
    }

    private handleResponse(): void {
        const stageTimeMs = performance.now() - this.timerStartMs;

        this.stageTimesMs = [...this.stageTimesMs, stageTimeMs];

        if (this.stage < this.totalStages) {
            this.assessmentState = AssessmentState.AWAITING_CONTINUE;
            this.displayState = DisplayState.DISPLAYING_STAGE;
            this.stage++;
        } else {
            this.calculateResults();

            this.assessmentState = AssessmentState.AWAITING_RESTART;
            this.displayState = DisplayState.DISPLAYING_RESULTS;
        }

        this.updateDisplayState();
    }

    private calculateResults(): void {
        const stageTimesMs = this.stageTimesMs;

        if (stageTimesMs.length === 0) return;

        const averageResponseTimeMs = Math.round(
            stageTimesMs.reduce((sum, time) => sum + time, 0) / stageTimesMs.length
        );

        this.bestAverageMs = (this.bestAverageMs === null || averageResponseTimeMs < this.bestAverageMs)
            ? averageResponseTimeMs
            : this.bestAverageMs;

        this.lastAverageMs = averageResponseTimeMs;
    }

    private continueAssessment(): void {
        this.assessmentState = AssessmentState.AWAITING_STIMULUS;
        this.displayState = DisplayState.AWAITING_STIMULUS;
        this.updateDisplayState();
    }

    private restartAssessment(): void {
        this.resetAssessment();

        this.assessmentState = AssessmentState.AWAITING_START;
        this.displayState = DisplayState.AWAITING_START;

        this.updateDisplayState();
    }

    private resetAssessment(): void {
        this.stage = 1;
        this.strikes = 0;
        this.timerStartMs = 0;

        this.stageTimesMs = [];
    }

    private readonly displayStateHandlers: Record<DisplayState, () => void> = {
        [DisplayState.AWAITING_START]: () => this.displayAwaitingStart(),
        [DisplayState.AWAITING_STIMULUS]: (): void => this.displayAwaitingStimulus(),
        [DisplayState.AWAITING_RESPONSE]: (): void => this.displayAwaitingResponse(),
        [DisplayState.DISPLAYING_STAGE]: (): void => this.displayStage(),
        [DisplayState.DISPLAYING_STRIKE]: (): void => this.displayStrike(),
        [DisplayState.DISPLAYING_FAILURE]: (): void => this.displayFailure(),
        [DisplayState.DISPLAYING_RESULTS]: (): void => this.displayResults()
    }

    private updateDisplayState(): void {
        this.displayStateHandlers[this.displayState]();
    }

    private updateContainer(displayStyle: DisplayStyle, textContent: string): void {
        const container: HTMLElement = this.htmlElements[0];

        container.style.backgroundColor = displayStyle.backgroundColor;
        container.style.color = displayStyle.textColor;
        container.textContent = textContent;
    }

    private updateElement(htmlElement: HTMLElement, textContent: string): void {
        htmlElement.textContent = textContent;
    }

    private displayAwaitingStart(): void {
        this.updateContainer(this.displayStyles.DEFAULT, "Click to Start");

        this.updateElement(this.htmlElements[1], "STAGE ─ ...");
        this.updateElement(this.htmlElements[2], "STRIKES ─ ...");
    }

    private displayAwaitingStimulus(): void {
        this.updateContainer(this.displayStyles.AWAITING_STIMULUS, "");
        this.updateElement(this.htmlElements[1], `STAGE ─ ${this.stage} / ${this.totalStages}`)

        const stimulusDelay = (Math.random() * (this.delayIntervals[1] - this.delayIntervals[0]) + this.delayIntervals[0]);

        this.waitTimeoutMs = window.setTimeout((): void => {
            this.assessmentState = AssessmentState.AWAITING_RESPONSE;
            this.displayState = DisplayState.AWAITING_RESPONSE;
            this.updateDisplayState();
        }, stimulusDelay);
    }

    private displayAwaitingResponse(): void {
        this.updateContainer(this.displayStyles.AWAITING_RESPONSE, "");
        this.timerStartMs = performance.now();
    }

    private displayStage(): void {
        const roundedStageTimeMs = Math.round(this.stageTimesMs[this.stageTimesMs.length - 1]);

        this.updateContainer(
            this.displayStyles.DEFAULT,
            `${roundedStageTimeMs} ms\n\nClick to Continue`
        );
    }

    private displayStrike(): void {
        this.updateContainer(
            this.displayStyles.DISPLAYING_STRIKE,
            `Strike ${this.strikes} / ${this.strikesLimit}`
        )

        this.updateElement(this.htmlElements[2], `STRIKES ─ ${this.strikes} / ${this.strikesLimit}`);
    }

    private displayFailure(): void {
        this.updateContainer(
            this.displayStyles.DISPLAYING_FAILURE,
            `Strike ${this.strikes} / ${this.strikesLimit}\n\nClick to Restart`
        );

        this.updateElement(this.htmlElements[2], `STRIKES ─ ${this.strikes} / ${this.strikesLimit}`);

        this.updateElement(this.htmlElements[3], "LAST ─ ...");
    }

    private displayResults(): void {
        this.updateContainer(
            this.displayStyles.DEFAULT,
            `Average ─ ${this.lastAverageMs} ms\n\nClick to Restart`
        );

        this.updateElement(this.htmlElements[3], `LAST ─ ${this.lastAverageMs} ms`);
        this.updateElement(this.htmlElements[4], `BEST ─ ${this.bestAverageMs} ms`);
    }

    constructor(
        totalStages: number = 5,
        strikesLimit: number = 3,
        minDelayMs: number = 1000,
        maxDelayMs: number = 5000,
        elementIds: string[] = [
            "assessment-container",
            "assessment-stage",
            "assessment-strikes",
            "assessment-last-average",
            "assessment-best-average"
        ],
        displayStyles?: Partial<DisplayStyles>
    ) {
        this.totalStages = totalStages;
        this.strikesLimit = strikesLimit;
        this.delayIntervals = [minDelayMs, maxDelayMs];

        this.htmlElements = this.getHTMLElementsByIds(elementIds);

        this.displayStyles = this.setDisplayStyles(displayStyles);

        this.bindEventHandlers();

        this.updateDisplayState();
    }

    private getHTMLElementsByIds(elementIds: readonly string[]): HTMLElement[] {
        return elementIds.map(elementId => {
            const htmlElement = document.getElementById(elementId);

            if (!htmlElement) {
                throw new AssessmentError(`Required HTMLElement with ID "${elementId}" was not found.`);
            }

            return htmlElement;
        });
    }

    private setDisplayStyles(displayStyles?: Partial<DisplayStyles>): DisplayStyles {
        return {
            DEFAULT: displayStyles?.DEFAULT || { backgroundColor: "#7F7FFF", textColor: "#000000" },
            AWAITING_STIMULUS: displayStyles?.AWAITING_STIMULUS || { backgroundColor: "#FF0000", textColor: "#000000" },
            AWAITING_RESPONSE: displayStyles?.AWAITING_RESPONSE || { backgroundColor: "#00FF00", textColor: "#000000" },
            DISPLAYING_STRIKE: displayStyles?.DISPLAYING_STRIKE || { backgroundColor: "#FF7F00", textColor: "#000000" },
            DISPLAYING_FAILURE: displayStyles?.DISPLAYING_FAILURE || { backgroundColor: "#BF1F1F", textColor: "#000000" }
        };
    }

    private bindEventHandlers(): void {
        // When the user presses their mouse button down, register a response.
        this.htmlElements[0].addEventListener("mousedown", this.handleMouseDown.bind(this));

        // When the user presses WASD, UDLR, or space, register a response.
        document.addEventListener("keydown", this.handleKeypress.bind(this));

        // Disable the context menu and selection within the assessment container.
        this.htmlElements[0].addEventListener("contextmenu", mouseEvent => mouseEvent.preventDefault());
        this.htmlElements[0].addEventListener("selectstart", event => event.preventDefault());
    }

    private handleMouseDown(): void {
        try {
            this.inputStateHandlers[this.assessmentState]();
        } catch (inputHandlerError) {
            console.error(`MouseDown handler threw an exception! ${inputHandlerError}.`);

            this.restartAssessment();
        }
    }

    private handleKeypress(keypressEvent: KeyboardEvent): void {
        switch (keypressEvent.key) {
            case " ":
            case "w":
            case "a":
            case "s":
            case "d":
            case "ArrowUp":
            case "ArrowDown":
            case "ArrowLeft":
            case "ArrowRight":
                try {
                    this.inputStateHandlers[this.assessmentState]();
                } catch (handlerError) {
                    console.error(`Keypress handler threw an exception! ${handlerError}.`);

                    this.restartAssessment();
                }

                break;
            default:
                break;
        }
    }

    public getTotalStages(): number {
        return this.totalStages;
    }

    public setTotalStages(totalStages: number): void {
        this.totalStages = totalStages;
    }

    public getStrikesLimit(): number {
        return this.strikesLimit;
    }

    public setStrikesLimit(strikesLimit: number): void {
        this.strikesLimit = strikesLimit;
    }

    public getDelayIntervalsInMilliseconds(): readonly number[] {
        return [...this.delayIntervals];
    }

    public setDelayIntervalsInMilliseconds(minimumMilliseconds: number, maximumMilliseconds: number): void {
        this.delayIntervals = [minimumMilliseconds, maximumMilliseconds];
    }

    private totalStages: number;
    private strikesLimit: number;
    private delayIntervals: [number, number];

    private readonly htmlElements: HTMLElement[] = [];
    private readonly displayStyles: DisplayStyles;

    private stage: number = 1;
    private strikes: number = 0;

    private lastAverageMs: number = 0;
    private bestAverageMs: number | null = null;

    private stageTimesMs: number[] = [];

    private waitTimeoutMs: number | null = null;

    private timerStartMs: number = 0;

    private assessmentState: AssessmentState = AssessmentState.AWAITING_START;
    private displayState: DisplayState = DisplayState.AWAITING_START;
}

class AssessmentError extends Error {
    constructor(message: string) {
        super(`[ASSESSMENT] [ERROR]: ${message}.`);

        this.name = "AssessmentError";
    }
}

document.addEventListener("DOMContentLoaded", async (): Promise<void> => {
    new Assessment();
});