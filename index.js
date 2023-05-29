import * as dotenv from 'dotenv'
dotenv.config()
import { YMApi } from "ym-api";
import SpotifyWebApi from "spotify-web-api-node";
const api = new YMApi();
import qs from 'qs';
import axios from "axios";


const spotifyApi = new SpotifyWebApi({
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    redirectUri: process.env.sredirectUri
});
// getAuthLink();
spotifyApi.setAccessToken(process.env.saccess_token);
function getAuthLink() {

    // const {data} = await axios.post(
    //     "https://accounts.spotify.com/api/token",
    //     qs.stringify({'grant_type':'client_credentials'}),
    //     {
    //         headers: { 
    //             'Authorization': `Basic ${Buffer.from(`${process.env.clientId}:${process.env.clientSecret}`, 'utf-8').toString('base64')}`,
    //             'Content-Type': 'application/x-www-form-urlencoded' 
    //         }
    //     }
    // );

    var scopes = ['user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing', 'app-remote-control', 'streaming', 'playlist-read-private', 'playlist-read-collaborative', 'playlist-modify-private', 'playlist-modify-public', 'user-follow-modify', 'user-follow-read', 'user-read-playback-position', 'user-top-read', 'user-read-recently-played', 'user-library-modify', 'user-library-read', 'user-read-email', 'user-read-private'],
        state = 'some-state-of-my-choice',
        showDialog = true,
        responseType = 'token';

    var authorizeURL = spotifyApi.createAuthorizeURL(
        scopes,
        state,
        showDialog,
        responseType
    );
    console.log(authorizeURL);
}


async function getYandexMusicList() {
    const searchTracks = [];
    try {
        await api.init({ uid: process.env.yuuid, access_token: process.env.yaccess_token });
        const favourite = await api.getPlaylist(3);

        for (let i = 0; i < favourite.tracks.length; i++) {
            const track = favourite.tracks[i];
            const trackInfo = await api.getTrack(track.id);
            // const trackName = trackInfo[0].artists.map(e => e.name).join(', ') + ' - ' + trackInfo[0].title;
            const trackName = { artist: trackInfo[0].artists.map(e => e.name).join(', '), track: trackInfo[0].title };
            searchTracks.push(trackName);
        }

        return searchTracks.reverse();

    } catch (e) {
        console.log(`api error ${e.message}`);
    }
}

const yandexSongs = await getYandexMusicList();
console.log(yandexSongs);
for (let i = 0; i < yandexSongs.length; i++) {
    const song = yandexSongs[i];
    await addToSpotify(song.artist, song.track)
}

async function addToSpotify(artist, track){
    spotifyApi.searchTracks(`track:${track} artist:${artist}`).then(
        function(data) {
            if(data.body.tracks.items.length){
                const songId = data.body.tracks.items[0].id;
                spotifyApi.containsMySavedTracks([songId]).then(function(data) {
                    const trackIsInYourMusic = data.body[0];
    
                    if (trackIsInYourMusic) {
                        console.log('Track was found in the user\'s Your Music library'+ `track:${track} artist:${artist}`);
                    } else {
                        spotifyApi.addToMySavedTracks([songId]).then(function(data) {
                                console.log('Added track!' + `track:${track} artist:${artist}`);
                            }, function(err) {
                                console.log('Something went wrong!', err);
                            });
                    }
                }, function(err) {
                    console.log('Something went wrong!', err);
                });
            }else{
                console.log('Не нашлось песни!' + `track:${track} artist:${artist}`);
            }
        }, 
        function(err) {
            console.log('Something went wrong!', err);
        }
    );
}
