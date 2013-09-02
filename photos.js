/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) {
        var i;
        for (i = 0; i < items.length; i += 1) {
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }

    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    function loadPhotosByTag (tag, max, callback) {
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) { return callback(err); }

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
    }

    function getFavorites () {
      var savedList = localStorage.getItem('favorites');
      var favorites = [];
      if (savedList){
        favorites = JSON.parse(savedList);
      }
      return favorites;
    }

    function isFavorite(url){
        var favorites = getFavorites();
        return (favorites.indexOf(url) >= 0);
    }

    function addFavorite(url){
        var favorites = getFavorites();
        favorites.push(url);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    function removeFavorite(url){
        var favorites = getFavorites();
        var index = favorites.indexOf(url);
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }


    function getIconClass(url){
        var className = 'icon-heart-empty icon-border';
        if (isFavorite(url)){
            className = 'icon-heart icon-border'
        }
        return className;
    }

    function toggleFavorite(icon){
        var url = icon.getAttribute('data-url');
        if (isFavorite(url)){
            removeFavorite(url);
        }else{
            addFavorite(url);
        };
        icon.className =  getIconClass(url);

    }

    function renderPhoto (photo) {
        var img = new Image();
        img.src = photo;
        return img;
    }

    function onFavoriteToggle (event) {
        var icon = event.currentTarget;
        toggleFavorite(icon);
    }

    function createFavoriteIcon(img){
        var icon = document.createElement('i');
        icon.className = getIconClass(img.src);
        icon.setAttribute("data-url", img.src);
        icon.addEventListener('click', onFavoriteToggle);
        return icon;
    }

    function createPhotoWrapper(img){
        var elm = document.createElement('div');
        elm.className = 'photo';        
        var icon = createFavoriteIcon(img);
        elm.appendChild(img);
        elm.appendChild(icon);
        return elm;
    }

    function imageAppender (id) {
        var holder = document.getElementById(id);
        var self = this;
        return function (img) {
            var elm = createPhotoWrapper(img);
            holder.appendChild(elm);
        };
    }

    // ----
    
    var max_per_tag = 5;
    return function setup (tags, callback) {
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) { return callback(err); }

            each(items.map(renderPhoto), imageAppender('photos'));
            callback();
        });
    };
}(jQuery));
