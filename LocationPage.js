const INITIAL_STATE = {
	city: null,
	district: null
};

class LocationPage {
	constructor(targetEl) {
		this.targetElement = targetEl;
		this.locationPicker = new LocationPicker({
			id: 'location-picker',
			handleNewLocation: ({city, district}) => {
				this.setState({
					city,
					district
				});
			}			
		});
		this.localStorageKey = 'state';
		this.setState(loadStateFromLocalStorage(this.localStorageKey, INITIAL_STATE));
	}

	render() {
		return `<div class='location'>
					${this.state.city ?
						`<h1>
							${this.state.district ?
								`${this.state.city}, ${this.state.district}`:
								this.state.city}
						</h1>`:
						'<h1> Местоположение не выбрано </h1>'}
					<button class='open-location-picker' ${this.state.city ? 'disabled' : ''}>Выбрать местоположение</button>
					<button class='reset-location' ${!this.state.city ? 'disabled' : ''}> Сбросить </button>
				</div>`;
	}

	componentDidUpdate() {
		document.querySelector('.open-location-picker').addEventListener('click', () =>{
			this.locationPicker.locationPickerModal.dialog('open')
		});
		document.querySelector('.reset-location').addEventListener('click', () => {
			this.setState({
				city: null,
				district: null
			})
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
		state = initialState;
	}	
	return state;
}