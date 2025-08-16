// Employee Stress Calculator JavaScript
// Place this file in /js/employee-stress-calculator.js

console.log('Employee Stress Calculator script loaded');

// Wait for the page to fully load
window.addEventListener('load', function() {
    console.log('Window loaded, initializing calculator...');
    
    // Utility Functions
    function formatWithCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    function removeCommas(str) {
        if (!str) return '';
        return String(str).replace(/,/g, '');
    }
    
    // Main Calculator Function
    function calculateStressCosts() {
        console.log('Running calculateStressCosts...');
        
        try {
            // Get input elements
            const empInput = document.getElementById('employees');
            const salInput = document.getElementById('avgSalary');
            const daysInput = document.getElementById('stressDays');
            
            console.log('Input elements found:', {
                employees: empInput ? 'yes' : 'no',
                salary: salInput ? 'yes' : 'no',
                days: daysInput ? 'yes' : 'no'
            });
            
            // Get values with defaults
            let employees = 250;
            let avgSalary = 55000;
            let stressDays = 10;
            
            if (empInput && empInput.value) {
                const cleanValue = removeCommas(empInput.value);
                const parsed = parseInt(cleanValue);
                if (!isNaN(parsed) && parsed > 0) {
                    employees = parsed;
                }
            }
            
            if (salInput && salInput.value) {
                const cleanValue = removeCommas(salInput.value);
                const parsed = parseInt(cleanValue);
                if (!isNaN(parsed) && parsed > 0) {
                    avgSalary = parsed;
                }
            }
            
            if (daysInput && daysInput.value) {
                const parsed = parseInt(daysInput.value);
                if (!isNaN(parsed) && parsed >= 0) {
                    stressDays = parsed;
                }
            }
            
            console.log('Using values:', { employees, avgSalary, stressDays });
            
            // Perform calculations
            const stressedEmployees = Math.round(employees * 0.47);
            const productivityLoss = Math.round(stressedEmployees * avgSalary * 0.34);
            const dailySalary = avgSalary / 260;
            const absenteeismCost = Math.round(employees * stressDays * dailySalary);
            const healthcareCost = Math.round(stressedEmployees * 3000);
            const turnoverCount = Math.round(stressedEmployees * 0.23);
            const turnoverCost = Math.round(turnoverCount * avgSalary * 1.5);
            const totalCost = productivityLoss + absenteeismCost + healthcareCost + turnoverCost;
            
            console.log('Calculated values:', {
                productivityLoss,
                absenteeismCost,
                healthcareCost,
                turnoverCost,
                totalCost
            });
            
            // Update display elements
            const elements = {
                'productivityLoss': productivityLoss,
                'absenteeismCost': absenteeismCost,
                'healthcareCost': healthcareCost,
                'turnoverCost': turnoverCost,
                'totalCost': totalCost
            };
            
            for (const [id, value] of Object.entries(elements)) {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = '$' + formatWithCommas(value);
                    console.log(`Updated ${id}: $${formatWithCommas(value)}`);
                } else {
                    console.error(`Element not found: ${id}`);
                }
            }
            
        } catch (error) {
            console.error('Error in calculateStressCosts:', error);
        }
    }
    
    // Initialize Calculator
    function initializeCalculator() {
        console.log('Initializing calculator...');
        
        try {
            // Get input elements
            const empInput = document.getElementById('employees');
            const salInput = document.getElementById('avgSalary');
            const daysInput = document.getElementById('stressDays');
            
            // Check if elements exist
            if (!empInput || !salInput || !daysInput) {
                console.error('Required input elements not found!');
                console.log('Looking for: employees, avgSalary, stressDays');
                // Try to find any input elements on the page for debugging
                const allInputs = document.querySelectorAll('input[type="number"]');
                console.log('Found ' + allInputs.length + ' number inputs on page');
                allInputs.forEach(function(input, index) {
                    console.log(`Input ${index}: id="${input.id}", value="${input.value}"`);
                });
                return;
            }
            
            // Set initial values
            if (!empInput.value) empInput.value = '250';
            if (!salInput.value) salInput.value = '55000';
            if (!daysInput.value) daysInput.value = '10';
            
            console.log('Initial values set');
            
            // Add input event listeners
            empInput.addEventListener('input', function() {
                console.log('Employee input changed to:', this.value);
                calculateStressCosts();
            });
            
            salInput.addEventListener('input', function() {
                console.log('Salary input changed to:', this.value);
                calculateStressCosts();
            });
            
            daysInput.addEventListener('input', function() {
                console.log('Days input changed to:', this.value);
                calculateStressCosts();
            });
            
            // Add blur event listeners for formatting
            empInput.addEventListener('blur', function() {
                const value = removeCommas(this.value);
                if (value && !isNaN(value)) {
                    this.value = formatWithCommas(value);
                }
            });
            
            salInput.addEventListener('blur', function() {
                const value = removeCommas(this.value);
                if (value && !isNaN(value)) {
                    this.value = formatWithCommas(value);
                }
            });
            
            // Run initial calculation
            console.log('Running initial calculation...');
            calculateStressCosts();
            
            // Format initial values after a short delay
            setTimeout(function() {
                if (empInput.value) {
                    const value = removeCommas(empInput.value);
                    if (value && !isNaN(value)) {
                        empInput.value = formatWithCommas(value);
                    }
                }
                if (salInput.value) {
                    const value = removeCommas(salInput.value);
                    if (value && !isNaN(value)) {
                        salInput.value = formatWithCommas(value);
                    }
                }
                console.log('Initial formatting complete');
            }, 100);
            
        } catch (error) {
            console.error('Error in initializeCalculator:', error);
        }
    }
    
    // Initialize Warning Signs
    function initializeWarningSigns() {
        console.log('Initializing warning signs...');
        
        let selectedSigns = 0;
        const stressAlert = document.getElementById('stressAlert');
        const stressPercentage = document.getElementById('stressPercentage');
        
        const signCards = document.querySelectorAll('.sign-card');
        console.log('Found ' + signCards.length + ' sign cards');
        
        signCards.forEach(function(card) {
            card.addEventListener('click', function() {
                this.classList.toggle('selected');
                
                if (this.classList.contains('selected')) {
                    selectedSigns++;
                } else {
                    selectedSigns--;
                }
                
                const percentage = Math.min(47 + (selectedSigns * 6), 89);
                
                if (selectedSigns >= 3 && stressAlert) {
                    stressAlert.style.display = 'block';
                    if (stressPercentage) {
                        stressPercentage.textContent = percentage;
                    }
                } else if (stressAlert) {
                    stressAlert.style.display = 'none';
                }
            });
        });
    }
    
    // Initialize Mobile Menu
    function initializeMobileMenu() {
        const mobileToggle = document.getElementById('mobileToggle');
        const navLinks = document.getElementById('navLinks');
        
        if (mobileToggle && navLinks) {
            mobileToggle.addEventListener('click', function() {
                navLinks.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });
            console.log('Mobile menu initialized');
        }
    }
    
    // Initialize Smooth Scroll
    function initializeSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId && targetId !== '#') {
                    const target = document.querySelector(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }
    
    // Main initialization
    console.log('Starting initialization...');
    initializeCalculator();
    initializeWarningSigns();
    initializeMobileMenu();
    initializeSmoothScroll();
    
    // Also try to initialize after a delay as fallback
    setTimeout(function() {
        console.log('Running delayed initialization check...');
        const testElement = document.getElementById('totalCost');
        if (testElement && testElement.textContent === '$0') {
            console.log('Calculator still showing $0, re-running calculation...');
            calculateStressCosts();
        }
    }, 500);
});

// Also add DOMContentLoaded as backup
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Check if calculator needs initialization
    setTimeout(function() {
        const totalElement = document.getElementById('totalCost');
        if (totalElement && totalElement.textContent === '$0') {
            console.log('Detected $0 in total, triggering recalculation...');
            
            // Try to trigger calculation directly
            const empInput = document.getElementById('employees');
            const salInput = document.getElementById('avgSalary');
            const daysInput = document.getElementById('stressDays');
            
            if (empInput) empInput.value = empInput.value || '250';
            if (salInput) salInput.value = salInput.value || '55000';
            if (daysInput) daysInput.value = daysInput.value || '10';
            
            // Force recalculation
            window.dispatchEvent(new Event('load'));
        }
    }, 1000);
});
