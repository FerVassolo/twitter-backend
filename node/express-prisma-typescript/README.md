# Twitter example

In this example you'll find an already setted up express server with some existing endpoints, authentication, error handling and more.

## Setup

- Install [Git](https://git-scm.com/), [Docker](https://www.docker.com/), [Node v18](https://nodejs.org/en/download/), [Yarn](https://yarnpkg.com/) and [Direnv](https://direnv.net/)
- Clone this repository
- Create a copy of [.envrc template](./.envrc.template) into `.envrc`
- Verify that you hooked [direnv into your shell](https://direnv.net/docs/hook.html)
- Run:
  ```
  direnv allow
  ```
- Run:
  ```
  docker compose up
  ```
- You're ready to go!

## Useful tools

- An API test tool, you can use the curl command or [Postman](https://www.postman.com/)
- A Database IDE, you can use [PgAdmin](https://www.pgadmin.org/), [Postico](https://eggerapps.at/postico2/), [DataGrip](https://www.jetbrains.com/datagrip/)

## Stack

### Express

Express is a fast, minimalist web framework for Node.js, it provides a way to serve content in a server. You can serve API requests, static content (like a compiled react app) or both.

You can have a server running with as little as 10 lines of code.

```
import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```

[Express Docs](https://expressjs.com/en/4x/api.html)

### Prisma

Prisma is an ORM (object-relational mapping) that it's purpose is to map SQL tables and columns into typescript types, in order to be able to query a database without the need of using SQL.

[Prisma Docs](https://www.prisma.io/docs)

## Code Structure

For every class inside the domain (Repository and Services) we create interface, and use dependency injection in the Controller.

We create Data Transfer Objects (DTOs) to abstract from database representation of an entity.

The structure is based on the [Three Layered Architecture](https://dev.to/blindkai/backend-layered-architecture-514h)

```
├── src
│   ├── domains
│   │   ├── domain_x
│   │   │   ├── controller
│   │   │   │   ├── index.ts
│   │   │   │   └── domain_x.controller.ts
│   │   │   ├── dto
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   ├── repository
│   │   │   │   ├── index.ts
│   │   │   │   ├── domain_x.repository.impl.ts
│   │   │   │   └── domain_x.repository.ts
│   │   │   └── service
│   │   │       ├── index.ts
│   │   │       ├── domain_x.service.impl.ts
│   │   │       └── domain_x.service.ts
│   │   └── ...
│   ├── router
│   │   └── index.ts
│   ├── types
│   │   └── index.ts
│   ├── utils
|   |   ├── index.ts
│   │   └── ...
│   ├── server.ts
```

## Endpoints

### Health

Endpoints for checking server health

- `GET api/health`

### Auth

Endpoints for user authentication

- `POST api/auth/login`
- `POST api/auth/signup`

### User

Endpoints for getting user information

- `GET api/user` returns recomended users paginated
- `GET api/user/me` returns information about the logged user
- `GET api/user/:user_id` returns information about an user by id
- `DELETE api/user` deletes the logged user

### Post

Endpoints for getting post information

- `GET api/post` returns post feed paginated
- `GET api/post/:post_id` returns a post by id
- `GET api/post/by_user/:user_id` returns all user posts by id
- `POST api/post` creates a post
- `DELETE api/post/:post_id` deletes a post by id

## Tasks

Fork this repository and complete the tasks. Then create a PR and start with your tasks.

- [x] There's an unused table `Follow` that stores follows between users. Create a new `follower` domain (with it's own controller, service and repositories) that has two new endpoints `POST /api/follower/follow/:user_id` and `POST /api/follower/unfollow/:user_id`.
- [x] All users are currently public, meaning that i can see tweets from anyone, without having to follow them. Add the ability for users to have private profiles and store it in the User table. Update the `GET api/post` to return only posts with public account authors or private account authors that the user follows.
- [x] Update the `GET api/post/:post_id` and `GET api/post/by_user/:user_id` to throw a 404 error if the author has a private account and the user does not follow them.
- [ ] The frontend team needs to integrate with the server, but they don't know what endpoints you have available or what they do. Document the API using [Swagger](https://blog.logrocket.com/documenting-express-js-api-swagger/)
  - [ ] Some remain, specially in the follower and auth domains.
  - Se me ocurre meterle un openapi.json a cada uno de los controllers. Preguntar si me dejan. El tema de esto es q no correría en http://localhost:8080/api-docs/
    - Si me apurás, me gusta como está ahora.
- [x] Add the ability to react to a post (like and retweet) both should be stored in the same table and using the endpoints `POST api/reaction/:post_id` and `DELETE api/reaction/:post_id`.
  - Though it may need a better revision, I think it works fine
- [x] Add the ability to comment in posts, a comment should be stored as a post, but still be able to query posts and comments separately.
  - [x] Add a "comment" endpoint on the post domain.
  - [x] When retrieving posts, exclude comments
  - [x] When retrieving comments, exclude posts
- [x] Create endpoints to query retweets, likes and comments by user id and put them in their respective domains.
  - [x] Likes
  - [x] Retweets
  - [x] Comments
- [x] Users do not currently have a profile picture. Integrate with AWS S3 to store user profile pictures and post pictures. Careful! Do not receive images in your endpoints. Make use of S3 Pre-signed URLs. Update the UserDTO to include the profile image. You can use a public S3 bucket as it doesn't contain private data.
  - [x] Implementar las 4 funciones del repo de storage
  - Que tome solo svg, png, jpg, jpeg 
    - As far as I'm concerned, that is not possible. The front-end should be responsible of that validation.
  - [x] Cada usuario tiene una carpeta, allí dentro tendrá dos carpetas más, una para los posts y otra para el perfil
  - Límite de 5MB por imagen. No sé cómo hacerlo.
    - Lo mismo que lo de los png. Se debería ocupar el front-end de esa verificación.
  - [x] Las post pictures sí pueden ser privadas. Actualizá el get para tener las url de las imágenes.
    - [x] Al hacer get posts que busque de aws los pre signed urls.
  - La imagen del Perfil no se guarda en la db
  - [x] En la db de post guardo como se llaman las imagenes que subió el usuario para después hacer `GET userId/post/PostId/imageName`
    - Guardarlas como `imageName` en la db
  - [x] Actualizá las reactions para que solo sean válidas a posts en pending.
    - [x] En realidad ya está hecho. Porque las reactions para acceder a post le piden al PostRepository, y este ya es está ocupando de que no pueda acceder.
  - [x] Eliminar el Storage controller al terminar.
- [x] Update  `GET api/user/me` and `GET api/user`  to return `UserViewDTO`.
- [x] Create endpoint `GET api/comment/:post_id` to get comments by post. Add Cursor Based Pagination (You can see how it works [here](./src/types/index.ts)). It should return `ExtendedPostDTO` and **sorted by reactions**.
- [x] Create endpoint `GET api/user/by_username/:username` to return a list of `UserViewDTO`  of those users whose usernames are included in `:username`. Add pagination.
  - Lo que dice es que que busques los usuarios cuyo username contengan el string `:username`.
    - Supongo q sirve para un buscador.
    - Y la paginación es porque el buscador te tira, no sé, los primeros 5 ponele.
- [x] Update `GET api/post` and `GET api/post/by_user/:user_id` to return a list of `ExtendedPostDTO`.
- [x] Update `GET api/user/:user_id` to return `UserViewDTO`. Also return if the user follows the one making the request.
- [ ] Using [SocketIO](https://socket.io/) create an authenticated websocket to create a real-time chat between users only if they follow eachother. Also messages should be stored in the database to keep the chat history.
  - [x] Extraer el UserId del socket auth
  - [x] Yo trato de mandar el msj, si el loco no está en el broadcast se manda el msj pero no se le envía a naides. De todos modos se guarda en la DB.
  - [x] Endpoint para agarrar mensajes por paginación


  - [x] Que solo se puedan enviar mensajes entre amigos. (llamar al método get friends en follower)
    - [x] Un usuario podría enviarle mensaje a otro si no es amigo. En el socket tira una alerta. 
      - [ ] QUIZÁ debería enviar un evento diciendole al sender "no se pudo enviar, no sigues a este usuario" o algo así.
    - [x] Cuando me pida mandar un mensaje, ver si son amigos. CORTA.
    - [x] Luego el front se ocupa de cargar lo q le pinte.
  - [x] Guardar los mensajes en la db
  - [x] Los últimos mensajes también mandalos por paginación cuando los cargas desde la db. 
    - [x] Cuando el usuario scrollea para arriba para ver más que le pida al back de nuevo con una nueva paginación
  - [x] Obviamente que si Fer está loggeado 20 veces que solo lo muestre una vez.
    - [x] Quizá hacer que un mismo usuario tenga muchas sesiones, ergo, Map<SocketId[], UserId>
  - [ ] Usar Redis para escalamiento horizontal. Por el momento guardo todo en la misma lista.
  - [ ] Si tenés tiempo: 
    - [ ] Que se puedan borrar mensajes
    - [ ] Que se puedan editar mensajes
    - [ ] Message status: SENT and SEEN. (received es bastante más complejo)
      - [x] Cuando se manda un mensaje, el socket envía un evento diciendo q se guardó
      - [ ] Cuando el usuario abre la ventana, se actualiza la DB marcando el mensaje como SEEN.
        - [ ] Lo de la ventana no es problema nuestro, simplemente que el front mande un evento cuando el usuario abra el chat.
        - [ ] Básicamente lo q tenés q hacer es un listener q cargue en la DB y un evento que avise al sender que su mensaje fue visto y al receiver uno diciendo que vio el mensaje.
      - [ ] Todo mensaje guardado en la DB arranca marcado como SENT.
  
- [ ] Search for a testing framework and create some unit tests. Make a CI/CD pipeline using github actions to run those tests.
- [ ] Deploy your backend and database to a service of your preference. Here are some recommended options:
    - [Railway](https://railway.app/)
    - [Fl/](https://docs.fl0.com/)
    - [Back4app](https://www.back4app.com/)
    - [AWS](https://aws.amazon.com/) (you need previous AWS knowledge)
  - SHOULD I INCLUDE THE DEPLOY IN THE CD/CI? Yes
- [ ] Crear tabla PendingPosts
- [ ] MODULARIZÁ
- [ ] Ver los TODOs que hayan quedado despedregados por el proyecto.
- [ ] Cada 1 hora, buscar todos los pending que se hayan creado hace más de 10 minutos y eliminarlos. Yo diría físicamente.
- [ ] Probar crear un usuario meterle post, follows, mensajes... y que al borrar al usuario que todo eso se borre también.
- [ ] Practicar presenta con pantalla dividida para poder leer notas y mostrar código a la vez.


# Chichiardum leviousa
- [ ] Que se puedan mandar imágenes por shat. Ahora, no sé si meterlo en S3, ¿cómo hace wpp web? ¿y twitter?
  - Si fuera una app es re fácil pq guardás en local storage.
    - Según entiendo, wpp web solo anda si tu cel está conectado, por lo tanto va al local storage de tu celu o algo así.
      - Twitter desktop supongo que lo guarda en un bucket.
  - Yo creo q puedo aprender algo acá.

## Extra

My IPv4 address is 192.168.64.22

So the Swagger would be: http://192.168.64.22:8080/api-docs/ 
