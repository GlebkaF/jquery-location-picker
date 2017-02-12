document.addEventListener('DOMContentLoaded', () => {
	const locationPage = new LocationPage(document.getElementById('root'));	
	$('#reset').on('click', () => {
		locationPage.setState({
			city: null,
			district: null
		})
	});
})
