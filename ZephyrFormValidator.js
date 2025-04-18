/**
 * ZephyrFormValidator – A Form Validation Library
 * Version: 0.0.1-dev
 *
 * Zephyr Form Validator is a lightweight, dependency-free JavaScript library for form
 * validation. It offers custom rules, dynamic error handling, and class toggling for
 * valid/invalid states—ensuring smooth input validation and a better user experience.
 *
 * Author: Md.Sarwar Alam
 * GitHub: https://github.com/sarwaralamini
 * Library: https://github.com/sarwaralamini/zephyr-form-validator
 *
 * Released under the MIT License
 */

class ZephyrFormValidator {
  constructor(form, options = {}) {
    this.form = form;
    this.options = {
      fields: options.fields || {},
      errorClass: options.errorClass || "error",
      validationClasses: options.validationClasses || {},
    };
    this.errors = {};
    this.defaultMessages = {
      required: "The {field} field is required.",
      min: "{field} must be at least {min} characters long.",
      max: "{field} must not exceed {max} characters.",
      email: "Please enter a valid email address.",
      pattern: "The {field} format is invalid.",
      range: "The value must be between {min} and {max}.",
      date: "Please enter a valid date in the format {format}.",
      equalTo: "{field} field must match the {targetField} field.",
    };

    // Cache regex patterns
    this.datePatterns = {
      YYYY: "\\d{4}",
      YY: "\\d{2}",
      MM: "(0[1-9]|1[0-2])",
      M: "([1-9]|1[0-2])",
      DD: "(0[1-9]|[12]\\d|3[01])",
      D: "([1-9]|[12]\\d|3[01])",
    };
    this.emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (form) {
      this.bindEvents();
    }
  }

  bindEvents() {
    this.form.addEventListener("submit", (e) => {
      if (!this.validate()) {
        e.preventDefault();
      }
    });
  }

  validate() {
    this.errors = {};
    this.clearErrors();

    const inputs = Array.from(
      this.form.querySelectorAll("input, textarea, select")
    ).filter((input) => this.options.fields[input.name || input.id]);

    let isValid = true;

    inputs.forEach((input) => {
      const fieldName = input.name || input.id;
      if (!this.validateField(input, this.options.fields[fieldName])) {
        isValid = false;
      }
    });

    return isValid;
  }

  validateField(input, rules) {
    if (!rules) return true;
  
    const value = input.value.trim();
    const fieldName = input.name || input.id;
  
    if (this.runValidations(input, value, fieldName, rules)) {
      return false; // Validation failed
    }
  
    this.clearError(input);
    this.removeInvalidClasses(input);
  
    this.addValidClasses(input);
  
    return true;
  }

  runValidations(input, value, fieldName, rules) {
    return (
      this.checkRequired(input, value, fieldName, rules) ||
      this.checkMin(input, value, rules) ||
      this.checkMax(input, value, rules) ||
      this.checkEmail(input, value, rules) ||
      this.checkPattern(input, value, fieldName, rules) ||
      this.checkRange(input, value, rules) ||
      this.checkDate(input, value, rules) ||
      this.checkEqualTo(input, value, rules)
    );
  }

  checkRequired(input, value, fieldName, rules) {
    if (rules.required?.value && !value) {
      const message =
        rules.required.message ||
        this.formatMessage(this.defaultMessages.required, { field: fieldName });
      this.addError(input, message);
      return true;
    }
    return false;
  }

  checkMin(input, value, rules) {
    if (rules.min && value.length < rules.min.value) {
      const fieldName = input.name || input.id;
      const message =
        rules.min.message ||
        this.formatMessage(this.defaultMessages.min, { 
          field: fieldName,
          min: rules.min.value 
        });
      this.addError(input, message);
      return true;
    }
    return false;
  }

  checkMax(input, value, rules) {
    if (rules.max && value.length > rules.max.value) {
      const fieldName = input.name || input.id;
      const message =
        rules.max.message ||
        this.formatMessage(this.defaultMessages.max, { 
          field: fieldName,
          max: rules.max.value 
        });
      this.addError(input, message);
      return true;
    }
    return false;
  }

  checkEmail(input, value, rules) {
    if (rules.email?.value && value && !this.emailPattern.test(value)) {
      this.addError(input, this.defaultMessages.email);
      return true;
    }
    return false;
  }

  checkPattern(input, value, fieldName, rules) {
    if (rules.pattern && value) {
      const pattern = new RegExp(rules.pattern.value);
      if (!pattern.test(value)) {
        const message =
          rules.pattern.message ||
          this.formatMessage(this.defaultMessages.pattern, {
            field: fieldName,
          });
        this.addError(input, message);
        return true;
      }
    }
    return false;
  }

  checkRange(input, value, rules) {
    if (rules.range && value) {
      const numericValue = parseFloat(value);
      const { min, max } = rules.range;

      if (isNaN(numericValue) || numericValue < min || numericValue > max) {
        const message =
          rules.range.message ||
          this.formatMessage(this.defaultMessages.range, { min, max });
        this.addError(input, message);
        return true;
      }
    }
    return false;
  }

  checkDate(input, value, rules) {
    if (rules.date && value) {
      const format = rules.date.format || "YYYY-MM-DD";

      if (!this.isValidDate(value, format)) {
        const message =
          rules.date.message ||
          this.formatMessage(this.defaultMessages.date, { format });
        this.addError(input, message);
        return true;
      }
    }
    return false;
  }

  checkEqualTo(input, value, rules) {
    if (rules.equalTo && value) {
      const fieldName = input.name || input.id;
      const targetFieldName = rules.equalTo.field;
      const targetField = this.form.querySelector(
        `[name="${targetFieldName}"], #${targetFieldName}`
      );
      
      if (targetField && value !== targetField.value) {
        let targetDisplayName = targetFieldName;
        const message =
          rules.equalTo.message ||
          this.formatMessage(this.defaultMessages.equalTo, {
            field: fieldName,
            targetField: targetDisplayName,
          });
        this.addError(input, message);
        return true;
      }
    }
    return false;
  }

  formatMessage(template, values) {
    let message = template;
    
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'field' || key === 'targetField') {
        let formattedValue = value;
        
        if (/^[A-Z]/.test(value) || /[a-z][A-Z]/.test(value)) {
          formattedValue = value
            .replace(/([A-Z])/g, ' $1')
            .trim();
        }
        
        formattedValue = formattedValue.replace(/_/g, ' ');
        
        const isStartOfMessage = template.indexOf(`{${key}}`) === 0;
        if (isStartOfMessage) {
          formattedValue = formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1).toLowerCase();
        } else {
          formattedValue = formattedValue.toLowerCase();
        }
        
        message = message.replace(`{${key}}`, formattedValue);
      }
    });
    
    Object.entries(values).forEach(([key, value]) => {
      if (key !== 'field' && key !== 'targetField') {
        message = message.replace(`{${key}}`, value);
      }
    });
    
    return message;
  }

  isValidDate(value, format) {
    let regexStr = format.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const [key, pattern] of Object.entries(this.datePatterns)) {
      regexStr = regexStr.replace(new RegExp(key, "g"), `(${pattern})`);
    }

    const regex = new RegExp(`^${regexStr}$`);
    if (!regex.test(value)) return false;

    let year, month, day;
    const formatParts = format.match(/(YYYY|YY|MM|M|DD|D)/g) || [];
    const valueParts = value.match(/\d+/g) || [];

    if (formatParts.length !== valueParts.length) return false;

    for (let i = 0; i < formatParts.length; i++) {
      const part = formatParts[i];
      const val = parseInt(valueParts[i], 10);

      if (part === "YYYY") {
        year = val;
      } else if (part === "YY") {
        year = 2000 + val;
      } else if (part === "MM" || part === "M") {
        month = val - 1;
      } else if (part === "DD" || part === "D") {
        day = val;
      }
    }

    if (year === undefined || month === undefined || day === undefined) {
      return false;
    }

    const date = new Date(year, month, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    );
  }

  addError(input, message) {
    this.errors[input.name || input.id] = message;
    this.displayError(input, message);
  }

  displayError(input, message) {
    this.clearError(input);
    this.removeInvalidClasses(input);
    this.removeValidClasses(input);

    const errorElement = document.createElement("span");
    const errorClass = this.getErrorClass();
    errorElement.className = errorClass;
    errorElement.innerText = message;

    errorElement.dataset.zephyrError = true;

    input.parentNode.insertBefore(errorElement, input.nextSibling);

    const invalidInputClass = this.options.validationClasses.isInvalid?.input;
    if (invalidInputClass) {
      invalidInputClass.split(" ").forEach((cls) => input.classList.add(cls));
    }
  }

  getErrorClass() {
    return (
      this.options.validationClasses.isInvalid?.error || this.options.errorClass
    );
  }

  addValidClasses(input) {
    const validClasses = this.options.validationClasses.isValid;
    
    if (validClasses) {
      
      if (validClasses.input) {
        validClasses.input.split(" ").forEach(cls => input.classList.add(cls));
      }
      
      if (validClasses.error) {
        const validElement = document.createElement("span");
        validElement.className = validClasses.error;
        validElement.dataset.zephyrValid = true;
        
        const existingFeedback = input.parentNode.querySelector("[data-zephyr-valid]");
        if (existingFeedback) existingFeedback.remove();
        
        input.parentNode.insertBefore(validElement, input.nextSibling);
      }
    }
  }

  removeValidClasses(input) {
    const validClasses = this.options.validationClasses?.isValid?.input;
    if (validClasses) {
      validClasses.split(" ").forEach(cls => input.classList.remove(cls));
    }
    
    if (this.options.validationClasses?.isValid?.error) {
      const parent = input.parentNode;
      const validElements = parent.querySelectorAll("[data-zephyr-valid]");
      validElements.forEach(el => el.remove());
    }
  }

  removeInvalidClasses(input) {
    const invalidInputClass = this.options.validationClasses.isInvalid?.input;
    if (invalidInputClass) {
      invalidInputClass
        .split(" ")
        .forEach((cls) => input.classList.remove(cls));
    }
  }

  clearError(input) {
    const errorClass = this.getErrorClass();
    const parent = input.parentNode;
  
    const errorElements = parent.querySelectorAll(
      `[data-zephyr-error], .${errorClass}`
    );
    errorElements.forEach((el) => el.remove());
    
    if (this.options.validationClasses.isValid?.error) {
      const validElements = parent.querySelectorAll("[data-zephyr-valid]");
      validElements.forEach((el) => el.remove());
    }
  }

  clearErrors() {
    const errorClass = this.getErrorClass();
    const errorElements = this.form.querySelectorAll(
      `[data-zephyr-error], .${errorClass}`
    );
    errorElements.forEach((el) => el.remove());
    
    if (this.options.validationClasses.isValid?.error) {
      const validElements = this.form.querySelectorAll("[data-zephyr-valid]");
      validElements.forEach((el) => el.remove());
    }
  
    const inputs = this.form.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      this.removeInvalidClasses(input);
      this.removeValidClasses(input);
    });
  }

  getErrors() {
    return { ...this.errors };
  }

  reset() {
    this.clearErrors();
    this.errors = {};
  }
}
