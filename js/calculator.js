// calculator.js - ROI Calculator for Clover Era
(function() {
    'use strict';
    
    function runCalculator() {
        try {
            // Get all elements
            var empEl = document.getElementById('employees');
            var salEl = document.getElementById('salary');
            var turnEl = document.getElementById('turnover');
            var resultEl = document.getElementById('calcResult');
            
            // Check if all elements exist
            if (!empEl || !salEl || !turnEl || !resultEl) {
                console.log('Calculator elements not found');
                return;
            }
            
            // Get values with defaults
            var employees = parseFloat(empEl.value) || 250;
            var salary = parseFloat(salEl.value) || 75000;
            var turnover = parseFloat(turnEl.value) || 15;
            
            // Calculate annual loss (1.5x salary per employee who leaves)
            var employeesLeaving = employees * (turnover / 100);
            var costPerEmployee = salary * 1.5;
            var totalLoss = Math.round(employeesLeaving * costPerEmployee);
            
            // Format with commas
            var formattedLoss = '$' + totalLoss.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            
            // Update display
            resultEl.textContent = formattedLoss;
            console.log('Calculator updated to:', formattedLoss);
        } catch (error) {
            console.error('Calculator error:', error);
        }
    }
    
    function setupCalculator() {
        try {
            console.log('Setting up calculator...');
            
            // Get input elements
            var empEl = document.getElementById('employees');
            var salEl = document.getElementById('salary');
            var turnEl = document.getElementById('turnover');
            
            // Add event listeners to employees input
            if (empEl) {
                empEl.addEventListener('input', runCalculator);
                empEl.addEventListener('change', runCalculator);
                console.log('Employees input listeners added');
            }
            
            // Add event listeners to salary input
            if (salEl) {
                salEl.addEventListener('input', runCalculator);
                salEl.addEventListener('change', runCalculator);
                console.log('Salary input listeners added');
            }
            
            // Add event listeners to turnover input
            if (turnEl) {
                turnEl.addEventListener('input', runCalculator);
                turnEl.addEventListener('change', runCalculator);
                console.log('Turnover input listeners added');
            }
            
            // Run initial calculation
            runCalculator();
            console.log('Initial calculation complete');
            
        } catch (error) {
            console.error('Setup error:', error);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupCalculator);
    } else {
        // DOM is already loaded, run setup with small delay
        setTimeout(setupCalculator, 100);
    }
    
    // Also run on window load as backup
    window.addEventListener('load', function() {
        setTimeout(setupCalculator, 500);
    });
    
    // Make function globally available for testing
    window.runCalculator = runCalculator;
    
})();
