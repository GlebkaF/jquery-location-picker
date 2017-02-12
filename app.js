const RUSSIA_ID = 643;
const CITIES_API_URL = 'http://geo.ngs.ru/api/v1/cities';
const DISTRICTS_API_URL = 'http://geo.ngs.ru/api/v1/districts';
const INITIAL_STATE = {
	city: null,
	district: null
}

document.addEventListener('DOMContentLoaded', () => {
	// DIALOG UI
	const locationPickerModal = $("#location-picker");		
	const cityPickerEl = $("#location-picker > .city-select");
	const districtPickerEl = $("#location-picker > .district-select-wrapper > .district-select");
	const noDistrictsEl = $("#location-picker > .no-districts");
	const districtsLoadingEl = $("#location-picker > .districts-loading");
	const submitButton = $("#location-picker > .submit-button");
	initializeDialogUI(locationPickerModal);
	initializeSelect2(cityPickerEl, {
		placeholder: 'Выберите город',
		ajaxUrl: CITIES_API_URL,		
		ajaxDataHandler: (p) => ({
			country_id: RUSSIA_ID,
			q: p.term
		})
	});
	initializeSelect2(districtPickerEl, {
		placeholder: 'Выберите район',
		disabled: true
	})

	cityPickerEl.on("change", (e) => {
		const cityId = $(e.target).val();
		const url = `${DISTRICTS_API_URL}?city_id=${cityId}`;		
		submitButton.prop("disabled", true);		
		districtPickerEl.val([]); //reset district picker
		fetch(url)
			.then(res => res.json())
			.then(data => {
				if (data.result.length > 0) {
					return data.result
				}
				else {
					throw new Error('There are no districts in this city');
				}
			})
			.then(() => {
				districtPickerEl.parent().show();
				noDistrictsEl.hide();
				initializeSelect2(districtPickerEl, {
					placeholder: 'Выберите район',
					ajaxUrl: DISTRICTS_API_URL,
					ajaxDataHandler: (p) => ({
						city_id: cityId,
						q: p.term
					})
				});
			})
			.catch(err => {
				districtPickerEl.parent().hide();
				noDistrictsEl.show();
				submitButton.prop("disabled", false)
			});	
	});

	districtPickerEl.on("change", (e) => {
		submitButton.prop("disabled", false)
	});

	//Page
	const locationPage = new LocationPage(document.getElementById('root'), () => {
		locationPickerModal.dialog('open');
	});		

	submitButton.on("click", (e) => {
		locationPickerModal.dialog('close');
		locationPage.setState({
			city: cityPickerEl.text(),
			district: districtPickerEl.text()
		});
		//TODO fix reset
	});	

	$('#reset').on('click', () => {
		locationPage.setState({
			city: null,
			district: null
		})
	});

})


class LocationPage {
	constructor(targetEl, openPickerHandler) {		
		this.targetElement = targetEl; // TODO: check that el exist
		this.LocationPicker = new LocationPicker();
		this.openPickerHandler = openPickerHandler;	
		this.localStorageKey = 'state';
		this.setState(loadStateFromLocalStorage(this.localStorageKey, INITIAL_STATE));						
	}

	componentDidUpdate() {
		this.openLocationPickerButton = document.querySelector('.open-location-picker');
		this.openLocationPickerButton.addEventListener('click', this.openPickerHandler);
	}

	setState(newState) {		
		this.state = newState;
		saveStateToLocalStorage(this.localStorageKey, this.state);
		console.log('state updated', this.state);
		this.updateView();
	}

	updateView() {
		this.targetElement.innerHTML =  this.render();
		this.componentDidUpdate();
	}

	render() {
		return `<div class='location'>
					${!!this.state.city ?
						`<p> Ваше местоположение:
						${this.state.city} ${!!this.state.district ? `, ${this.state.district}` : ''}</p>`:
						'<p> Местоположение не выбрано </p>'}					
					<button class='open-location-picker' ${!!this.state.city ? 'disabled' : ''}>Выбрать местоположение</button>
				</div>`;
	}
}

class LocationPicker {
	constructor() {
		
	}
}


function saveStateToLocalStorage(key, state) {
	localStorage.setItem(key, JSON.stringify(state));	
}

function loadStateFromLocalStorage(key, initialState = {}) {
	let state = {};
	try {
		state = JSON.parse(localStorage.getItem(key)) || initialState;			
	}	
	catch(e) {
		console.log(e)
		state = initialState;
	}	
	return state;
}

function initializeDialogUI(el) {
	el.dialog({
			modal: true,
			autoOpen: false,		
			 open: function () {
			 	$('.ui-widget-overlay').bind('click', function() {
                	el.dialog('close');
            	})
		        if ($.ui && $.ui.dialog && !$.ui.dialog.prototype._allowInteractionRemapped && $(this).closest(".ui-dialog").length) {
		            if ($.ui.dialog.prototype._allowInteraction) {
		                $.ui.dialog.prototype._allowInteraction = () => true;                
		                $.ui.dialog.prototype._allowInteractionRemapped = true;
		            }
		        }
		    },
		    _allowInteraction: function (event) {
		        return !!$(event.target).is(".select2-input") || this._super(event);
		    }
	});
}

function initializeSelect2(el, {placeholder, ajaxUrl, ajaxDataHandler, disabled = false}) {
	el.val([]);
	el.select2({
		placeholder: placeholder,
		minimumInputLength: 1,
		disabled: disabled,
		language: {
			inputTooShort: () => "Начните вводить название",
			searching: () => "Ищем совпадения...",
			noResults: () => "Совпадений не найдено"
		},
		ajax: {
			url: ajaxUrl,
			dataType: 'json',
			delay: 250,
			data: ajaxDataHandler,
			processResults: function (data, params) {
				return {
					results: apiResToSelect2Array(data)
				};
			},
			cache: true
		}
	});
}

function apiResToSelect2Array(res) {	
	return res.result.map(item => {
							return {
								id: item.id,
								text: item.name_ru
							};
						});
}
