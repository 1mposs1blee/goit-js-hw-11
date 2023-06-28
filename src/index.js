import PixabayApi from './js/pixabay-api';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import throttle from 'lodash.throttle';

const refs = {
  html: document.documentElement,
  formEl: document.querySelector('.search-form'),
  submitBtn: document.querySelector('button[type="submit"]'),
  scrollUpBtn: document.querySelector('.scrollup-button'),
  galleryEl: document.querySelector('.gallery'),
};

const API = new PixabayApi();
const gallery = new SimpleLightbox('.gallery a', {
  captionDelay: 250,
  captionsData: 'alt',
});

let isCollectionLimitReached = false;

const checkCollectionLimit = ({ data }) => {
  const isPerPageMore = data.hits.length < API.per_page;
  const isEqualQuantity = API.page * API.per_page === data.totalHits;
  const isLimit = API.page * API.per_page >= data.totalHits;

  if (isPerPageMore || isEqualQuantity || isLimit) {
    isCollectionLimitReached = true;

    Notiflix.Notify.failure(
      "We're sorry, but you've reached the end of search results.",
      {
        timeout: 2000,
      }
    );
  }
};

const renderMarkup = ({ data: { hits: photos } }) => {
  const markup = photos
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) =>
        `
        <div class="photo-card">
        <a href="${largeImageURL}">
      <img src="${webformatURL}" width="300" height="300" alt="${tags}" loading="lazy" />
      </a>
      <div class="info">
        <p class="info-item">
        Likes
          <b>${likes}</b>
        </p>
        <p class="info-item">
        Views
          <b>${views}</b>
        </p>
        <p class="info-item">
        Comments
          <b>${comments}</b>
        </p>
        <p class="info-item">
        Downloads
          <b>${downloads}</b>
        </p>
      </div>
    </div>`
    )
    .join('');

  refs.galleryEl.insertAdjacentHTML('beforeend', markup);
};

const handleScroll = async () => {
  const { scrollTop, clientHeight, scrollHeight } = refs.html;

  if (scrollTop + clientHeight > scrollHeight - clientHeight) {
    try {
      if (isCollectionLimitReached) {
        return;
      }

      API.addPage();

      const response = await API.fetchPhotos();

      renderMarkup(response);

      gallery.refresh();

      checkCollectionLimit(response);
    } catch (err) {
      console.log(err);
    }
  }

  if (scrollTop > 0) {
    refs.scrollUpBtn.hidden = false;

    return;
  }

  refs.scrollUpBtn.hidden = true;
};

const onScrollUpBtnClick = () => {
  const { scrollHeight } = refs.html;

  window.scrollBy({
    top: -scrollHeight,
    behavior: 'smooth',
  });
};

const onFormSubmit = async e => {
  e.preventDefault();

  isCollectionLimitReached = true;

  refs.scrollUpBtn.hidden = true;

  const inputValue = e.target.elements.searchQuery.value;

  if (!inputValue.trim()) {
    refs.galleryEl.innerHTML = '';
    refs.submitBtn.disabled = false;

    Notiflix.Notify.failure('Please, enter some text in the search bar.', {
      timeout: 2000,
    });

    return;
  }

  refs.submitBtn.disabled = true;
  refs.galleryEl.innerHTML = '';

  try {
    API.resetPage();
    API.querry = inputValue;

    const response = await API.fetchPhotos();

    e.target.elements.searchQuery.value = '';

    if (response.data.hits.length === 0) {
      refs.submitBtn.disabled = false;

      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.',
        {
          timeout: 2000,
        }
      );

      return;
    }

    Notiflix.Notify.success(
      `Hooray! We found ${response.data.totalHits} images.`,
      {
        timeout: 2000,
      }
    );

    renderMarkup(response);

    gallery.refresh();

    isCollectionLimitReached = false;

    checkCollectionLimit(response);

    refs.submitBtn.disabled = false;
  } catch (err) {
    console.log(err);
  }
};

refs.formEl.addEventListener('submit', onFormSubmit);
refs.scrollUpBtn.addEventListener('click', onScrollUpBtnClick);
window.addEventListener('scroll', throttle(handleScroll, 400));
