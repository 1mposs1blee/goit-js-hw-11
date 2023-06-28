import axios from 'axios';

const BASE_URL = 'https://pixabay.com/api/';
const API_KEY = '37872358-2227a9d6e20f7552b1349a54b';

export default class PixabayApi {
  querry = '';
  page = 1;
  per_page = 40;

  async fetchPhotos() {
    const response = await axios.get(`${BASE_URL}`, {
      params: {
        key: API_KEY,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
        q: this.querry,
        page: this.page,
        per_page: this.per_page,
      },
    });

    return response;
  }

  resetPage() {
    this.page = 1;
  }

  addPage() {
    this.page += 1;
  }
}
