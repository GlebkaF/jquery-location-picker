const RUSSIA_ID = 643;
const CITIES_API_URL = 'https://geo.ngs.ru/api/v1/cities';
const DISTRICTS_API_URL = 'https://geo.ngs.ru/api/v1/districts';

class LocationPicker {
	constructor({
		handleNewLocation = () => {},
		id = 'location-picker'
	}) {
		this.id = id;
		$('body').append(this.render());
		this.locationPickerModal = $(`#${this.id}`);
		this.cityPickerEl = $(`#${this.id} > .select-wrapper >.city-select`);
		this.districtPickerEl = $(`#${this.id} > .select-wrapper > .district-select`);
		this.noDistrictsEl = $(`#${this.id} > .no-districts`);
		this.submitButton = $(`#${this.id} > .location-picker-submit-button`);
		this.handleNewLocation = handleNewLocation;
		initializeDialogUI(this.locationPickerModal);
		this.setInitialState();
		this.cityPickerEl.on('change', this.handleCityChange.bind(this));
		this.districtPickerEl.on('change', this.handleDistrictChange.bind(this));
		this.submitButton.on('click', this.handleSubmit.bind(this));
	}

	render() {
		return `<div id='${this.id}'>
					<h2> Выбор местоположения:</h2>
					<div class='select-wrapper'>
						<select class='city-select'></select>
					</div>
					<div class='select-wrapper'>
						<select class='district-select'></select>
					</div>
					<p class='no-districts'>В этом городе нет районов</p>
					<button disabled='true' class='location-picker-submit-button'>
						Подтвердить
					</button>
				</div>`
	}

	setInitialState() { 
		this.city = null;
		this.district = null;   
		this.districtPickerEl.parent().show();
		this.noDistrictsEl.hide();
		this.cityPickerEl.text('');
		this.districtPickerEl.text('')  
		this.submitButton.prop('disabled', true);
		initializeSelect2(this.districtPickerEl, {
			placeholder: 'Выберите район',
			disabled: true
		});
		initializeSelect2(this.cityPickerEl, {
			placeholder: 'Выберите город',
			ajaxUrl: CITIES_API_URL,        
			ajaxDataHandler: (p) => ({
				country_id: RUSSIA_ID,
				q: p.term
			})
		});
	}

	handleCityChange(e) {
		this.city = $(e.target).select2("data").pop().text;
		const cityId = $(e.target).val();
		const districtsUrl = `${DISTRICTS_API_URL}?city_id=${cityId}`;
		this.submitButton.prop('disabled', true);
		this.resetSelectedDictrict();
		fetch(districtsUrl)
			.then(res => res.json())
			.then(data => {
				if (data.result.length > 0) {
					return data.result
				}
				else {
					throw new Error('There are no districts in this city');
				}
			})
			.then(() => this.showDistrictPicker(cityId))
			.catch(() => this.showNoDistrictsMessage());
	}

	showDistrictPicker(cityId) {
		this.districtPickerEl.parent().show();
		this.noDistrictsEl.hide();
		initializeSelect2(this.districtPickerEl, {
			placeholder: 'Выберите район',
			minimumInputLength: 0,
			ajaxUrl: DISTRICTS_API_URL,
			ajaxDataHandler: (p) => ({
				city_id: cityId,
				q: p.term
			})
		});
	}

	resetSelectedDictrict() {
		this.district = null;
		this.districtPickerEl.val([]);
	}   

	showNoDistrictsMessage() {
		this.districtPickerEl.parent().hide();
		this.noDistrictsEl.show();
		this.submitButton.prop('disabled', false)
	}

	handleDistrictChange(e) {
		this.district = $(e.target).select2("data").pop().text;
		this.submitButton.prop('disabled', false)
	}

	handleSubmit() {
		this.handleNewLocation({
			city: this.city,
			district: this.district
		}); 
		this.locationPickerModal.dialog('close');
		this.setInitialState();
	}
}

function initializeDialogUI(el) {
	el.dialog({
			modal: true,
			resizable: false,
			autoOpen: false,
			open: function () {
				$('.ui-widget-overlay').bind('click', function() {
					el.dialog('close');
				})
				if ($.ui && $.ui.dialog && !$.ui.dialog.prototype._allowInteractionRemapped && $(this).closest('.ui-dialog').length) {
					if ($.ui.dialog.prototype._allowInteraction) {
						$.ui.dialog.prototype._allowInteraction = () => true;
						$.ui.dialog.prototype._allowInteractionRemapped = true;
					}
				}
			},
			_allowInteraction: function (event) {
				return !!$(event.target).is('.select2-input') || this._super(event);
			}
	});
}

function initializeSelect2(el, {placeholder, ajaxUrl, ajaxDataHandler, minimumInputLength = 1, disabled = false}) {
	el.select2({
		placeholder: placeholder,
		minimumInputLength: minimumInputLength,
		width: '100%',
		disabled: disabled,
		language: {
			inputTooShort: () => 'Начните вводить название',
			searching: () => 'Ищем совпадения...',
			noResults: () => 'Совпадений не найдено'
		},
		ajax: {
			url: ajaxUrl,
			dataType: 'json',
			delay: 250,
			data: ajaxDataHandler,
			processResults: function (data) {
				return {
					results: data.result.map(item => {
								return {
									id: item.id,
									text: item.name_ru
								};
							})
				};
			},
			cache: true
		}
	});
}
