
document.addEventListener('DOMContentLoaded', function () {
    var menuToggle = document.getElementById('menuToggle');
    var sidebar = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('is-open');
        });
    }

    var standaloneDeleteButtons = document.querySelectorAll('[data-delete-id]:not(.btn-icon)');
    standaloneDeleteButtons.forEach(function (button) {
        button.addEventListener('click', handleDeleteClick);
    });
});

function initStudentsTable() {
    var searchInput = document.getElementById('studentSearch');
    var classFilter = document.getElementById('classFilter');
    var genderFilter = document.getElementById('genderFilter');
    var sortBy = document.getElementById('sortBy');
    var tableBody = document.getElementById('studentsTableBody');

    if (!tableBody) {
        return;
    }

    if (searchInput) searchInput.addEventListener('input', applyTableFilters);
    if (classFilter) classFilter.addEventListener('change', applyTableFilters);
    if (genderFilter) genderFilter.addEventListener('change', applyTableFilters);
    if (sortBy) sortBy.addEventListener('change', applyTableFilters);

    attachDeleteHandlers();

    updateResultsCount();
}


function applyTableFilters() {
    var searchInput = document.getElementById('studentSearch');
    var classFilter = document.getElementById('classFilter');
    var genderFilter = document.getElementById('genderFilter');
    var tableBody = document.getElementById('studentsTableBody');

    var searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var classValue = classFilter ? classFilter.value : '';
    var genderValue = genderFilter ? genderFilter.value : '';

    var rows = Array.prototype.slice.call(tableBody.querySelectorAll('tr'));
    var visibleCount = 0;

    rows.forEach(function (row) {
        var name = (row.dataset.name || '').toLowerCase();
        var email = (row.dataset.email || '').toLowerCase();
        var rowClass = row.dataset.class || '';
        var rowGender = row.dataset.gender || '';

        var matchesSearch = searchTerm === '' ||
            name.indexOf(searchTerm) !== -1 ||
            email.indexOf(searchTerm) !== -1;

        var matchesClass = classValue === '' || rowClass === classValue;
        var matchesGender = genderValue === '' || rowGender === genderValue;

        var isMatch = matchesSearch && matchesClass && matchesGender;

        row.hidden = !isMatch;
        if (isMatch) {
            visibleCount += 1;
        }
    });

    sortTableRows();
    updateResultsCount();

    var emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
    }
}

function sortTableRows() {
    var sortBy = document.getElementById('sortBy');
    var tableBody = document.getElementById('studentsTableBody');
    if (!sortBy || !sortBy.value) {
        return;
    }

    var rows = Array.prototype.slice.call(tableBody.querySelectorAll('tr'));
    var option = sortBy.value; // e.g. "name-asc", "age-desc"
    var field = option.split('-')[0];   // "name", "age", or "class"
    var direction = option.split('-')[1]; // "asc" or "desc"

    rows.sort(function (rowA, rowB) {
        var valueA, valueB;

        if (field === 'age') {
            valueA = parseInt(rowA.dataset.age, 10) || 0;
            valueB = parseInt(rowB.dataset.age, 10) || 0;
        } else if (field === 'class') {
            valueA = rowA.dataset.class || '';
            valueB = rowB.dataset.class || '';
        } else {
            valueA = rowA.dataset.name || '';
            valueB = rowB.dataset.name || '';
        }

        var comparison;
        if (typeof valueA === 'number') {
            comparison = valueA - valueB;
        } else {
            comparison = valueA.localeCompare(valueB);
        }

        return direction === 'desc' ? comparison * -1 : comparison;
    });

    rows.forEach(function (row) {
        tableBody.appendChild(row);
    });
}

function updateResultsCount() {
    var tableBody = document.getElementById('studentsTableBody');
    var resultsCount = document.getElementById('resultsCount');
    if (!tableBody || !resultsCount) {
        return;
    }

    var allRows = tableBody.querySelectorAll('tr');
    var visibleRows = tableBody.querySelectorAll('tr:not([hidden])');

    resultsCount.textContent = visibleRows.length + ' of ' + allRows.length + ' students shown';
}

function attachDeleteHandlers() {
    var deleteButtons = document.querySelectorAll('.btn-delete[data-delete-id]');
    deleteButtons.forEach(function (button) {
        button.addEventListener('click', handleDeleteClick);
    });
}

function initDeleteConfirm(buttonId) {
    var button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener('click', handleDeleteClick);
    }
}


function handleDeleteClick(event) {
    var button = event.currentTarget;
    var studentId = button.dataset.deleteId;
    var studentName = button.dataset.deleteName || 'this student';

    var confirmed = window.confirm('Delete ' + studentName + '? Are You Sure About This !.');
    if (!confirmed) {
        return;
    }

    fetch('/students/' + studentId + '/delete', {
        method: 'POST'
    }).then(function (response) {
        if (response.ok) {
            var row = button.closest('tr');
            if (row) {
                row.remove();
                updateResultsCount();
            } else {
                window.location.href = '/students';
            }
        } else {
            alert('Delete failed. Please try again.');
        }
    });
}

function initFormValidation(formId) {
    var form = document.getElementById(formId);
    if (!form) {
        return;
    }

    form.addEventListener('submit', function (event) {
        var isValid = validateForm(form);

        if (!isValid) {
            event.preventDefault();
            showMessage('formBanner', 'Please fix the highlighted fields below.', 'error');
        }
    });

    var fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(function (field) {
        field.addEventListener('blur', function () {
            validateField(field);
        });
    });
}


function validateForm(form) {
    var fields = form.querySelectorAll('input, select, textarea');
    var formIsValid = true;

    fields.forEach(function (field) {
        var fieldIsValid = validateField(field);
        if (!fieldIsValid) {
            formIsValid = false;
        }
    });

    return formIsValid;
}

function validateField(field) {
    var formField = field.closest('.form-field');
    var errorElement = formField ? formField.querySelector('.field-error') : null;

    var isValid = field.checkValidity();
    var message = '';

    if (!isValid) {
        if (field.validity.valueMissing) {
            message = 'This field is required.';
        } else if (field.validity.typeMismatch && field.type === 'email') {
            message = 'Enter a valid email address.';
        } else if (field.validity.patternMismatch && field.type === 'tel') {
            message = 'Enter a valid phone number.';
        } else if (field.validity.tooShort) {
            message = 'Must be at least ' + field.minLength + ' characters.';
        } else if (field.validity.rangeUnderflow || field.validity.rangeOverflow) {
            message = 'Enter a value between ' + field.min + ' and ' + field.max + '.';
        } else {
            message = 'Please check this field.';
        }
    }

    if (formField) {
        formField.classList.toggle('has-error', !isValid);
    }
    if (errorElement) {
        errorElement.textContent = message;
    }

    return isValid;
}


function showMessage(bannerId, text, type) {
    var banner = document.getElementById(bannerId);
    if (!banner) {
        return;
    }

    banner.textContent = text;
    banner.hidden = false;
    banner.classList.remove('form-banner--success', 'form-banner--error');
    banner.classList.add(type === 'success' ? 'form-banner--success' : 'form-banner--error');
}