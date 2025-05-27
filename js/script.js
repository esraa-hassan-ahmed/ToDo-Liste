"use strict";

$(document).ready(function() {
    // DOM Elemente
    const $todoInput = $('#todo-input');
    const $addBtn = $('#add-btn');
    const $todoList = $('#todo-list');
    const $allBtn = $('#all-btn');
    const $activeBtn = $('#active-btn');
    const $completedBtn = $('#completed-btn');
    const $taskCount = $('#task-count');
    const $emptyState = $('#empty-state');

    // API Endpoints
    const API_BASE_URL = 'api/';
    const GET_TASKS_URL = API_BASE_URL + 'get_tasks.php';
    const SAVE_TASKS_URL = API_BASE_URL + 'save_tasks.php';

    // App State
    let currentFilter = 'all';
    let aufgaben = [];

    // Initialisierung
    init();

    // Main Functions
    function init() {
        setupEventListeners();
        aufgabenLaden();
    }
    // Event Listeners
    function setupEventListeners() {
        $addBtn.on('click', aufgabeHinzufuegen);
        $todoInput.on('keypress', function(e) {
            if (e.key === 'Enter') aufgabeHinzufuegen();
        });
        
        $allBtn.on('click', () => aufgabenFiltern('all'));
        $activeBtn.on('click', () => aufgabenFiltern('active'));
        $completedBtn.on('click', () => aufgabenFiltern('completed'));
    }

    // Neue Aufgabe hinzufügen
    function aufgabeHinzufuegen() {
        const text = $todoInput.val().trim();
        if (text === '') return;
        
        const neueAufgabe = {
            id: Date.now(),
            text: text,
            erledigt: false,
            erstellt_am: new Date().toISOString()
        };
        
        // Lokal hinzufügen
        aufgaben.push(neueAufgabe);
        aufgabeAnzeigen(neueAufgabe);
        
        // Auf Server speichern
        aufgabenSpeichern()
        .then(() => {
            // Eingabe zurücksetzen
            $todoInput.val('');
            
            // UI aktualisieren
            updateUI();
            showNotification("Hinzufügung", true);
        })
        .catch(() => {
            showNotification("Hinzufügung", false);
        })

    }

    // Aufgabe anzeigen
    function aufgabeAnzeigen(aufgabe) {
        if (!sollAufgabeAngezeigtWerden(aufgabe)) return;
        
        const $aufgabeItem = $('<li>', {
            class: 'todo-item' + (aufgabe.erledigt ? ' completed' : ''),
            'data-id': aufgabe.id
        });
        
        $aufgabeItem.html(`
            <input type="checkbox" class="todo-checkbox" ${aufgabe.erledigt ? 'checked' : ''}>
            <span class="todo-text">${aufgabe.text}</span>
            <div class="todo-actions">
                <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `);
        
        // Event Delegation
        $aufgabeItem.find('.todo-checkbox').on('change', function() {
            aufgabeStatusAendern(aufgabe.id, $(this).is(':checked'));
        });
        
        $aufgabeItem.find('.delete-btn').on('click', function() {
            aufgabeLoeschen(aufgabe.id);
        });
        
        $aufgabeItem.find('.edit-btn').on('click', function() {
            aufgabeBearbeiten(aufgabe.id);
        });
        
        $todoList.append($aufgabeItem);
    }

    // Soll Aufgabe angezeigt werden?
    function sollAufgabeAngezeigtWerden(aufgabe) {
        switch (currentFilter) {
            case 'active': return !aufgabe.erledigt;
            case 'completed': return aufgabe.erledigt;
            default: return true; // 'all'
        }
    }

    // Aufgabenstatus ändern
    function aufgabeStatusAendern(id, istErledigt) {
        // Lokal aktualisieren
        aufgaben = aufgaben.map(aufgabe => {
            if (aufgabe.id === id) {
                return { ...aufgabe, erledigt: istErledigt };
            }
            return aufgabe;
        });
        
        // Auf Server speichern
        aufgabenSpeichern()
        .then(() => {
            // UI aktualisieren
            if (currentFilter !== 'all') {
                $(`.todo-item[data-id="${id}"]`).remove();
            } else {
                $(`.todo-item[data-id="${id}"]`).toggleClass('completed', istErledigt);
            }
            
            updateUI();
            showNotification("aufgabeStatusAendern", true);

        })
        .catch(() => {
            showNotification("aufgabeStatusAendern", false);
        })

    }

    // Aufgabe bearbeiten
    function aufgabeBearbeiten(id) {
        const $aufgabeItem = $(`.todo-item[data-id="${id}"]`);
        const $textSpan = $aufgabeItem.find('.todo-text');
        const aktuellerText = $textSpan.text();
        
        const $input = $('<input>', {
            type: 'text',
            class: 'edit-input',
            val: aktuellerText
        });
        
        $textSpan.replaceWith($input);
        $input.focus();
        
        const bearbeitungSpeichern = () => {
            const neuerText = $input.val().trim();
            
            if (neuerText === '') {
                aufgabeLoeschen(id);
                return;
            }
            
            // Lokal aktualisieren
            aufgaben = aufgaben.map(aufgabe => {
                if (aufgabe.id === id) {
                    return { ...aufgabe, text: neuerText };
                }
                return aufgabe;
            });
            
            // Auf Server speichern
            aufgabenSpeichern()
            .then(() => {
                // UI aktualisieren
                $textSpan.text(neuerText);
                $input.replaceWith($textSpan);
                showNotification("Bearbeitung", true);
            })
            .catch(() => {
                showNotification("Bearbeitung", false);
            })
            

        };
        
        $input.on('blur', bearbeitungSpeichern)
              .on('keypress', function(e) {
                  if (e.key === 'Enter') bearbeitungSpeichern();
              });
    }

    // Aufgabe löschen
    function aufgabeLoeschen(id) {
        // Lokal entfernen
        aufgaben = aufgaben.filter(aufgabe => aufgabe.id !== id);
        
        // Auf Server speichern
        aufgabenSpeichern()
        .then(() => {
            // Mit Animation entfernen
            $(`.todo-item[data-id="${id}"]`).css({
                'transform': 'translateX(100%)',
                'opacity': '0'
            }).remove();
            
            updateUI();
            showNotification("Löschung", true);

        })
        .catch(() => {
            showNotification("Löschung", false);
        })
        

    }

    // Aufgaben filtern
    function aufgabenFiltern(filter) {
        currentFilter = filter;
        
        // Aktiven Button markieren
        $('.filter-btn').removeClass('active');
        $(`#${filter}-btn`).addClass('active');
        
        // Liste neu aufbauen
        $todoList.empty();
        aufgaben.forEach(aufgabe => aufgabeAnzeigen(aufgabe));
        
        updateUI();
    }

    // Aufgaben vom Server laden
    function aufgabenLaden() {
        $.ajax({
            url: GET_TASKS_URL,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data && data.length) {
                    aufgaben = data;
                    aufgabenFiltern(currentFilter);
                }
                updateUI();
            },
            error: function(xhr, status, error) {
                console.log('Fehler beim Laden der Aufgaben:', error);
                // aufgaben = JSON.parse(localStorage.getItem('aufgaben')) || [];
                // aufgabenFiltern(currentFilter);
                updateUI();
            }
        });
    }

    // Aufgaben auf Server speichern
    function aufgabenSpeichern() {

        return $.ajax({
            url: SAVE_TASKS_URL,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ tasks: aufgaben }),
            success: function() {
                console.log('Aufgaben erfolgreich gespeichert');
                // Save to localStorage immediately
                // localStorage.setItem('aufgaben', JSON.stringify(aufgaben));
            },
            error: function(xhr, status, error) {
                console.log('Fehler beim Speichern der Aufgaben:', error);
            }
        });
    }

    // UI aktualisieren
    function updateUI() {
        // Aufgaben-Zähler
        const anzahlAktiv = aufgaben.filter(a => !a.erledigt).length;
        $taskCount.text(anzahlAktiv);
        
        // Leeren Zustand prüfen
        const sichtbareAufgaben = aufgaben.filter(sollAufgabeAngezeigtWerden);
        $emptyState.toggle(sichtbareAufgaben.length === 0);
    }

    function showNotification(aktion, isSuccess) {
        const prefix = isSuccess ? 'Erfolgreiche ' : 'Fehler ';
        const nachricht = prefix + aktion;
        const $notification = $('<div>').addClass(`notification ${isSuccess ? 'success' : 'error'}`).text(nachricht);
        $('body').append($notification);
        
        setTimeout(() => $notification.addClass('show'), 100);
        
        setTimeout(() => {
            $notification.removeClass('show');
            setTimeout(() => $notification.remove(), 300);
        }, 3000);
    }
});