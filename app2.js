const RUSSIA_ID = 643;
const CITIES_API_URL = 'http://geo.ngs.ru/api/v1/cities';
const DISTRICTS_API_URL = 'http://geo.ngs.ru/api/v1/districts';

document.addEventListener('DOMContentLoaded', () => {	
	const locationPickerModal = $("#location-picker");
	locationPickerModal.dialog({
			modal: true,			
			 open: function () {
			 	$('.ui-widget-overlay').bind('click', function() {
                	locationPickerModal.dialog('close');
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
	const cityPickerEl = $("#location-picker > .city-select");
	const districtPickerEl = $("#location-picker > .district-select-wrapper > .district-select");
	const noDistrictsEl = $("#location-picker > .no-districts");
	const districtsLoadingEl = $("#location-picker > .districts-loading");
	const submitButton = $("#location-picker > .submit-button");
	cityPickerEl.select2({
		placeholder: 'Выберите город',
		minimumInputLength: 1,
		language: {
			inputTooShort: () => "Начните вводить название",
			searching: () => "Ищем совпадения...",
			noResults: () => "Совпадений не найдено"
		},
		ajax: {
			url: CITIES_API_URL,
			dataType: 'json',
			delay: 250,
			data: function (params) {
				return {
					country_id: RUSSIA_ID,
					q: params.term
				};
			},
			processResults: function (data, params) {
				return {
					results: apiResToSelect2Array(data)
				};
			},
			cache: true
		}
	});
	cityPickerEl.on("change", (e) => {
		const cityId = $(e.target).val();
		submitButton.prop("disabled", true)		
		districtPickerEl.val([]);
		districtPickerEl.select2(getDistrictPickerOptions());	
		$.ajax({
  			url: `${DISTRICTS_API_URL}?city_id=${cityId}`,
  			success: (data) => {
  				if(data.result.length > 0) {
  					districtPickerEl.parent().show();
					noDistrictsEl.hide();
  					districtPickerEl.select2(getDistrictPickerOptions(cityId));
  				}
  				else {
  					districtPickerEl.parent().hide();
					noDistrictsEl.show();
					submitButton.prop("disabled", false)
  				}
  			}
		});
		
	});
	districtPickerEl.select2(getDistrictPickerOptions());
	districtPickerEl.on("change", (e) => {
		submitButton.prop("disabled", false)
	});


	submitButton.on("click", (e) => {
		console.log('clicked!');
	});	

	
})

function getDistrictPickerOptions(cityId, data) {
	let options = {};
	if(cityId) {
		options = {
			placeholder: 'Выберите район',
			data: [],
			disabled: false,
			minimumInputLength: 0,
			language: {
				inputTooShort: () => "Начните вводить название",
				searching: () => "Ищем совпадения...",
				noResults: () => "Совпадений не найдено"
			},
			ajax: {
				url: DISTRICTS_API_URL,
				dataType: 'json',
				delay: 250,
				containerCss: function (element) {
			        var style = $(element)[0].style;
			        return {
			            display: style.display
			        };
			    },
				data: function (params) {
					return {
						city_id: cityId,
						q: params.term
					};
				},
				processResults: function (data, params) {
					return {
						results: apiResToSelect2Array(data)
					};
				},
				cache: true
			}
		};			
	} 
	else {
		options = {
			data: [],
			placeholder: 'Выберите район',
			disabled: true
		};
	}
	return options;
}

function apiResToSelect2Array(res) {	
	return res.result.map(item => {
							return {
								id: item.id,
								text: item.name_ru
							};
						});
}