// This is a basic example strategy for Gekko.
// For more information on everything please refer
// to this document:
//
// https://gekko.wizb.it/docs/strategies/creating_a_strategy.html
//
// The example below is pretty bad investment advice: on every new candle there is
// a 10% chance it will recommend to change your position (to either
// long or short).

var log = require('../core/log');

// Let's create our own strat
var strat = {};

// Prepare everything our method needs
strat.init = function() {
  this.hasCrossed = false;
  this.hold = true;
  this.enteredTheMarket = false;
  this.addTulipIndicator('fast', 'ema', {
    optInTimePeriod: this.settings.fast
  });
  this.addTulipIndicator('slow', 'ema', {
    optInTimePeriod: this.settings.slow
  });

  this.warmupPeriod = 0;
};

// What happens on every new candle?
strat.update = function(candle) {
  const fastCurb = this.tulipIndicators.fast.result.result;
  const slowCurb = this.tulipIndicators.slow.result.result;

  const isWarmingUp = this.warmupPeriod < this.settings.slow;
  if (isWarmingUp) {
    this.warmupPeriod++;
  }


  if (this._currentDirection === 'long' && 
    candle.close / this.lastBuyPrice < 1 - this.settings.lossThresholdPercentage/100) {
        this.hold = false;
  } else if(this.previousFastCurb !== undefined && this.previousSlowCurb !== undefined && !isWarmingUp) {
    const hasCrossed = (this.previousSlowCurb < this.previousFastCurb) !== (slowCurb < fastCurb);
    if ((slowCurb < fastCurb ) && (hasCrossed || !this.enteredTheMarket)) {
      this.hold = false;
      this.enteredTheMarket = true;
      console.log(candle.start.format('LLLL'));
      console.log('yellow', slowCurb);
      console.log('green', fastCurb);
    } else   {
      this.hold = true;
    }
  }
  this.previousSlowCurb = slowCurb;
  this.previousFastCurb = fastCurb;
}

// For debugging purposes.
strat.log = function() {
  // log.debug('calculated random number:');
  // log.debug('\t', this.randomNumber.toFixed(3));
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function() {  
  if(this.hold) {
    return;
  }

  if(this._currentDirection === 'long') {
    // If it was long, set it to short
    this.advice('short');
  } else {
    // If it was short, set it to long
    this.advice('long');
  }
};

module.exports = strat;
