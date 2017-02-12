const RUSSIA_ID = 643;
const CITIES_API_URL = 'http://geo.ngs.ru/api/v1/cities';
const DISTRICTS_API_URL = 'http://geo.ngs.ru/api/v1/districts';

class LocationPicker {
	constructor(handleNewLocation) {
		this.locationPickerModal = $("#location-picker");		
		this.cityPickerEl = $("#location-picker > .city-select");
		this.districtPickerEl = $("#location-picker > .district-select-wrapper > .district-select");
		this.noDistrictsEl = $("#location-picker > .no-districts");
		this.submitButton = $("#location-picker > .submit-button");
		this.handleNewLocation = handleNewLocation;
		this.submitButton.prop("disabled", true);
		initializeDialogUI(this.locationPickerModal);
		initializeSelect2(this.cityPickerEl, {
			placeholder: 'Выберите город',
			ajaxUrl: CITIES_API_URL,		
			ajaxDataHandler: (p) => ({
				country_id: RUSSIA_ID,
				q: p.term
			})
		});
		initializeSelect2(this.districtPickerEl, {
			placeholder: 'Выберите район',
			disabled: true
		})
	this.cityPickerEl.on("change", this.handleCityChange.bind(this));
	this.districtPickerEl.on("change", this.handleDistrictChange.bind(this));
	this.submitButton.on('click', this.handleSubmit.bind(this));
	}

	render() {
		return ``
	}

	handleCityChange(e) {
		const cityId = $(e.target).val();
		const districtsUrl = `${DISTRICTS_API_URL}?city_id=${cityId}`;		
		this.submitButton.prop("disabled", true);
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
			ajaxUrl: DISTRICTS_API_URL,
			ajaxDataHandler: (p) => ({
				city_id: cityId,
				q: p.term
			})
		});
	}

	resetSelectedDictrict() {
		this.districtPickerEl.val([]);
	}	

	showNoDistrictsMessage() {
		this.districtPickerEl.parent().hide();
		this.noDistrictsEl.show();
		this.submitButton.prop("disabled", false)
	}

	handleDistrictChange(e) {
		this.submitButton.prop("disabled", false)
	}

	handleSubmit(){
		this.handleNewLocation({
			city: this.cityPickerEl.text(),
			district: this.districtPickerEl.text()	
		});	
		this.locationPickerModal.dialog('close');		
	}
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
