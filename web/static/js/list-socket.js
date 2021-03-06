import {Socket} from "phoenix"

function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

let socket = new Socket("/socket", {params: {token: window.userToken}})

// When you connect, you'll often need to authenticate the client.
// For example, imagine you have an authentication plug, `MyAuth`,
// which authenticates the session and assigns a `:current_user`.
// If the current user exists you can assign the user's token in
// the connection for use in the layout.
//
// In your "web/router.ex":
//
//     pipeline :browser do
//       ...
//       plug MyAuth
//       plug :put_user_token
//     end
//
//     defp put_user_token(conn, _) do
//       if current_user = conn.assigns[:current_user] do
//         token = Phoenix.Token.sign(conn, "user socket", current_user.id)
//         assign(conn, :user_token, token)
//       else
//         conn
//       end
//     end
//
// Now you need to pass this token to JavaScript. You can do so
// inside a script tag in "web/templates/layout/app.html.eex":
//
//     <script>window.userToken = "<%= assigns[:user_token] %>";</script>
//
// You will need to verify the user token in the "connect/2" function
// in "web/channels/user_socket.ex":
//
//     def connect(%{"token" => token}, socket) do
//       # max_age: 1209600 is equivalent to two weeks in seconds
//       case Phoenix.Token.verify(socket, "user socket", token, max_age: 1209600) do
//         {:ok, user_id} ->
//           {:ok, assign(socket, :user, user_id)}
//         {:error, reason} ->
//           :error
//       end
//     end
//
// Finally, pass the token on connect as below. Or remove it
// from connect if you don't care about authentication.

function listSocket() {
  socket.connect()

  let end = moment(getParameterByName("end"));
  let start = moment(getParameterByName("start"));

  // Now that you are connected, you can join channels with a topic:
  let channel = socket.channel("calls:all", {})
  channel.join()
    .receive("ok", resp => { console.log("Joined successfully", resp) })
    .receive("error", resp => { console.log("Unable to join", resp) })

  channel.on("new", resp => {

    if(end.isValid() && end < moment(resp.time)) return;
    if(start.isValid() && start > moment(resp.time)) return;

    let $table = document.getElementById("calls-table");
    let $tr = document.createElement("tr");
    $tr.setAttribute("data-id", resp.id);
    $tr.innerHTML = `
    <td class="call_id"></td>
    <td class="time"></td>
    <td class="location"></td>
    <td class="nature"></td>
    <td class="status"></td>
    `;

    render($tr, resp);
    $table.querySelector("tbody").insertBefore($tr, $table.querySelector("tbody tr:first-child"));
  })

  channel.on("update", resp => {
    let $table = document.getElementById("calls-table");
    let $el = document.querySelector(`[data-id="${resp.id}"]`)
    render($el, resp)
  })

  function render($el, call) {
    $el.querySelector(".call_id").innerText = call.call_id;
    $el.querySelector(".time").innerText = moment(call.time).format("h:mm a");
    $el.querySelector(".location").innerText = call.location;
    $el.querySelector(".nature").innerText = call.nature;
    $el.querySelector(".status").innerText = call.status;
  }
}
export default listSocket
