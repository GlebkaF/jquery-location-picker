const INITIAL_STATE = {
	city: null,
	district: null
};

class LocationPage {
	constructor(targetEl) {		
		this.targetElement = targetEl;
		this.locationPicker = new LocationPicker(({city, district}) => {				
			this.setState({
				city,
				district
			});
		});
		this.localStorageKey = 'state';
		this.setState(loadStateFromLocalStorage(this.localStorageKey, INITIAL_STATE));						
	}

	render() {
		return `<div class='location'>
					${this.state.city ?
						`<p> Ваше местоположение:
						${this.state.district ?
							`${this.state.city}, ${this.state.district}`:
							this.state.city}</p>`:
						'<p> Местоположение не выбрано </p>'}					
					<button class='open-location-picker' ${!!this.state.city ? 'disabled' : ''}>Выбрать местоположение</button>
				</div>`;
	}

	componentDidUpdate() {		
		this.openLocationPickerButton = document.querySelector('.open-location-picker');
		this.openLocationPickerButton.addEventListener('click', () =>{
			this.locationPicker.locationPickerModal.dialog('open')
		});
	}

	setState(newState) {		
		this.state = newState;
		saveStateToLocalStorage(this.localStorageKey, this.state);
		this.updateView();
	}

	updateView() {
		this.targetElement.innerHTML =  this.render();
		this.componentDidUpdate();
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