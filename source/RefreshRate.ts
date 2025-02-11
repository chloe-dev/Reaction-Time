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
 * Monitor Refresh Rate Detector by Chloe B.
 */

interface MonitorStatistics {
    lastTime: number;
    frameCount: number;
    refreshRate: number;
}

const MONITOR_CONFIGURATION = {
    UPDATE_INTERVAL_MS: 1000,
    ELEMENT_ID: "reaction-assessment-refresh-rate",
} as const;

class RefreshRateMonitor {
    private displayElement : HTMLElement;
    private statistics: MonitorStatistics;
    private animationFrameId: number | null = null;

    constructor() {
        this.displayElement = this.initializeDisplayElement();
        this.statistics = this.initializeMonitorStatistics();

        this.start();
    }

    private initializeDisplayElement(): HTMLElement {
        const displayElement = document.getElementById(MONITOR_CONFIGURATION.ELEMENT_ID);

        if (!displayElement) {
            throw new Error("[MONITOR]: Required display element was not found.");
        }

        return displayElement;
    }

    private initializeMonitorStatistics(): MonitorStatistics {
        return {
            lastTime: performance.now(),
            frameCount: 0,
            refreshRate: 0
        };
    }

    private start(): void {
        this.animationFrameId = requestAnimationFrame(this.calculateRefreshRate.bind(this));
    }

    public stop(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    private calculateRefreshRate = (timestamp: DOMHighResTimeStamp): void => {
        ++this.statistics.frameCount;

        const deltaTime = timestamp - this.statistics.lastTime;

        if (deltaTime >= MONITOR_CONFIGURATION.UPDATE_INTERVAL_MS) {
            this.updateMonitorStatistics(timestamp);
        }

        this.animationFrameId = requestAnimationFrame(this.calculateRefreshRate);
    }

    private updateMonitorStatistics(currentTime: number): void {
        this.statistics.refreshRate = this.statistics.frameCount;

        this.statistics.frameCount = 0;
        this.statistics.lastTime = currentTime;

        this.updateDisplay();
    }

    private updateDisplay(): void {
        try {
            this.displayElement.textContent = `${this.statistics.refreshRate} Hz`;
        } catch (error) {
            console.error("[MONITOR]: Failed to update refresh rate display.", error);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    try {
        const refreshRateMonitor = new RefreshRateMonitor();

        window.addEventListener("unload", () => {
            refreshRateMonitor.stop();
        });
    } catch (error) {
        console.error("[MONITOR]: Failed to initialize refresh rate monitor.", error);
    }
});