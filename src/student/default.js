var { bool, number, timestamp, string,
list, map, maybe, nat, id, v,
shuffle, uuid, api, post,
student, question, answer, latency, ping, position,
attempt, rendition, board, rules, setup,
teacher_app, student_app, student_lookbehind,
board_viewer,
io, message, ensemble, 
default_questions, default_rules,
as_maybe, from_maybe,
app_nothing, app_get_ready, app_playing, app_game_over,
setup_room, setup_questions, setup_rules,
board_viewer_board, board_viewer_questions, board_viewer_history,
lookbehind_nothing, lookbehind_bad_room, lookbehind_attempting, 
io_inert, io_connecting,
ensemble_questions, ensemble_rules,
ensemble_ping, ensemble_start, ensemble_abort,
ensemble_student_pings, ensemble_student_starts,
ensemble_student_boards, ensemble_student_histories,
app_setup, app_student, app_students, app_room,
app_board, app_history, app_questions,
lookbehind_room, lookbehind_since, lookbehind_blocked,
rendition_attempts,
rules_size, setup_size,
question_view, question_answers,
cell_position, position_lens,
cell_answer, student_name,
history_stepped,
message_encoding, messages_encoding,
assemble_students, schedule_start,
teacher_app_get_ready_to_playing, 
student_app_get_ready_to_playing, student_app_next_playing,
student_app_to_board_viewer,
question_answer_matches, 
board_viewer_current_question,
board_viewer_crossed_positions, board_viewer_bingoed_positions,
T, $, L, R, S, Z, Z_, Z$, sanc, memoize, TimelineMax,
so, by, 
go, panic, panic_on,
just_now, temporal,
fiat, data, data_lens, data_iso, data_kind,
n_reducer, pair_zip_n, pair_zip, pair_projection,
map_defined, from_just, maybe_all,
sole, every, delay
} = window .stuff


var feedback = data ({
  nothing: () => feedback,
  enter_room: (room =~ room) => feedback,
  enter_name: (name =~ string) => feedback,
  attempt_question: (position =~ position) => feedback })




var lookbehind_nothing = data_iso (student_lookbehind .nothing)
var lookbehind_bad_room = data_iso (student_lookbehind .bad_room)
var lookbehind_attempting = data_iso (student_lookbehind .attempting)

var lookbehind_room = data_lens (student_lookbehind .bad_room) .room
var lookbehind_since = data_lens (student_lookbehind .attempting) .since
var lookbehind_blocked = data_lens (student_lookbehind .attempting) .blocked





 
var io_state = S .data (io .inert)
var ensemble_state = S .data (undefined)
var feedback_state = temporal (feedback .nothing)
var lookbehind_state = S .data (student_lookbehind .nothing)
var app_state = S .data (student_app .get_ready (Z .Nothing, Z .Nothing))









 
var clicking = ['click']


var room_entry_view = so ((_=_=>
  <room-entry-etc>
    <code fn={ room_entry_feedback }>
      <input placeholder="Enter a room code" />
      <button> Go </button> </code>
      { !! (L .isDefined (lookbehind_bad_room) (lookbehind_state ()))
        ? <message>{ bad_room } is not a valid room</message>
        : [] } </room-entry-etc>,
  where
  , bad_room = T (lookbehind_state ()) (L .get (lookbehind_room))
  , room_entry_feedback = _dom => {{
      var _input = _dom .querySelector ('input')
      var _button = _dom .querySelector ('button')
      ;_input .addEventListener ('keypress', _e => {{
        if (_e .keyCode === 13) {
          var value = _input .value
          ;_input .value = ''
          ;feedback_state (feedback .enter_room (value)) } }})
      ;clicking .forEach (click => {{
        ;_button .addEventListener (click, _e => {{
          var value = _input .value
          ;_input .value = ''
          ;feedback_state (feedback .enter_room (value)) }}) }}) }} )=>_)

var name_entry_view = so ((_=_=>
  <student-entry-etc>
    <name fn={ name_entry_feedback } >
      <input placeholder="Enter your name" />
      <button> Go </button>
    </name> </student-entry-etc>,
  where
  , name_entry_feedback = _dom => {{
      var _input = _dom .querySelector ('input')
      var _button = _dom .querySelector ('button')
      ;_input .addEventListener ('keypress', _e => {{
        if (_e .keyCode === 13) {
          var value = _input .value
          ;_input .value = ''
          ;feedback_state (feedback .enter_name (value)) } }})
      ;clicking .forEach (click => {{
        ;_button .addEventListener (click, _e => {{
          var value = _input .value
          ;_input .value = ''
          ;feedback_state (feedback .enter_name (value)) }}) }}) }}  )=>_)


var get_ready_view = _ => <get-ready-etc>
	{ so ((
		take
		, room = T (app_state ()) (L .get ([ app_room, as_maybe ]))
		, student = T (app_state ()) (L .get ([ app_student, as_maybe ])) ) =>
		!! Z .isNothing (room)
		? !! Z .not (L .isDefined (io_inert
    ) (io_state ()))
			? !! Z .not (L .isDefined (io_connecting
      ) (io_state ()))
				? panic ('invalid io at get ready view')
				: 'Finding room...'
			: room_entry_view
		: !! Z .isNothing (student)
		? !! Z .not (L .isDefined (io_inert
    ) (io_state ()))
			? !! Z .not (L .isDefined (io_connecting
      ) (io_state ()))
				? panic ('invalid io at get ready view')
				: 'Trying to join room...'
			: name_entry_view
		: so ((_=_=>
		[ <room> {'Connected to room ' + plain_room } </room>
		, 'Waiting for game to start...' ]
		.map (_x => <div>{ _x }</div>),
		where
		, { plain_room, plain_student } = from_just (maybe_all ({ plain_room: room, plain_student: student })) )=>_))
	} </get-ready-etc>

var playing_view = _ => <playing-etc>
	{ T (student_app_to_board_viewer (app_state ())
		) (Z_ .maybe ([]) (_board_viewer =>
			so ((_=_=>
			[ T (current_question
				) (Z_ .maybe ('') (_x => <question>{ L .get (question_view) (_x) }</question>))
			, <ticker>{ T (game_tick) (Z_ .maybe ('') (t => 10 - t)) }</ticker>
			, <board> { T (_board) (Z_ .map (_row => 
					<row> { T (_row) (Z_ .map (_cell =>
						so ((_=_=>
						!! (_cell_bingo)
						? <cell>{ bold_crossed (_cell_answer) }</cell>
						: !! (_cell_crossed)
						? <cell>{ crossed (_cell_answer) }</cell>
						: <cell fn={ cell_feedback (_cell) }>{ _cell_answer }</cell>,
						where
						, _cell_position = T (_cell) (L .get (cell_position))
						, _cell_answer = T (_cell) (L .get (cell_answer))
						, _cell_crossed = Z .elem (_cell_position) (crossed_positions)
						, _cell_bingo = R .any (Z .elem (_cell_position)) (bingoed_positions)
						, crossed = _x => <s>{ _x }</s>
						, bold_crossed = _x => <s><b>{ _x }</b></s> )=>_)))
						} </row> )) } </board> ],
			where
			, _board = T (_board_viewer) (L .get (board_viewer_board))
			, current_question = T (_board_viewer) (board_viewer_current_question)
			, crossed_positions = T (_board_viewer) (board_viewer_crossed_positions)
			, bingoed_positions = T (_board_viewer) (board_viewer_bingoed_positions)
			, game_tick = game_tick_sampler ()
      , cell_feedback = cell => _dom => {{
          ;clicking .forEach (click => {{
            ;_dom .addEventListener (click, _ => {{
              ;feedback_state (feedback .attempt_question (T (cell) (L .get (cell_position)))) }}) }}) }} )=>_))) } </playing-etc>

var game_over_view = _ =>
	so ((_=_=>
	<game-over-etc>
		<result-etc>
			<tabs>
				<button> Overview </button>
				<button> Question </button>
				</tabs>
			<id><img src={ student_img } />  (name) </id>
			<div a-logo> <img src={ bingo_img } /> </div>
			<table a-result>
				<tr>
					<th>Question</th>
					<th>Attempts</th>
					<th>Avg. Time</th>
					</tr>
				<tr>
					<td></td>
					<td></td>
					<td></td>
					</tr>
					</table>
					</result-etc>
					</game-over-etc>,
	where							
	, bingo_img = 'https://cdn.glitch.com/5a2d172b-0714-405a-b94f-6c906d8839cc%2Fimage5.png?1529492559081' 
	, student_img = 'https://cdn.glitch.com/cf9cdaee-7478-4bba-afce-36fbc451e9d6%2Fimage18.png'
	, _app = app_state ()
	, _app_kind = data_kind (_app)
	, _ensemble = ensemble_state ()
	, all_students = T (_ensemble) (assemble_students (_app_kind))
	, questions = T (_app) (L .collect ([ app_questions, L .elems, question_view ]))
	, attempts = T (_app) ([ L .collect ([ app_history, L .elems, rendition_attempts ]), Z_ .map (Z_ .size) ])
	//TODO: make readable
	, average_time = T (_ensemble) ([
			assemble_students (data_kind (_app)),
			Z_ .map ($ ([
				Z .snd,
				L .collect ([ [1], L .elems, rendition_attempts, L .last, [1], as_maybe ]),
				Z .map (Z .of (Array)) ])),
			_x => Z .reduce (Z .zipWith (Z .concat)) (R .head (_x)) (R .tail (_x)),
			Z .map ($ ([ Z .justs, average, Z_ .fromMaybe (_ => panic ('average time fail!')) ])) ])
	, average = by (list => $ ([
			Z .sum,
			Z .div (Z .size (list)) ])) )=>_)


window .view = <student-app>
	{ !! (L .isDefined (app_get_ready) (app_state ()))
		? get_ready_view
		: !! (L .isDefined (app_playing) (app_state ()))
		? playing_view
		: !! (L .isDefined (app_game_over) (app_state ()))
		? game_over_view
		: undefined } </student-app>














/*
var lookbehind_latency = _ => {
		var now = game_clock .time ()
		var start = T (game_clock .getLabelTime ('next'))
			(_x => !! (_x === -1) ? 0 : _x)
		return now - start }
*/
			 
			 
			 
			 
			 
var record_room = _room => {{
	var _student = T (S .sample (app_state)) (L .get ([ app_student, as_maybe ]))
	;go 
	.then (_ =>
		io_state (io .connecting) && api (_room)
		.then (panic_on ([ [Z_ .equals ({}), 'empty room; expired code?'] ]))
		.then ($ ([
			L .get (L .inverse (data_iso (ensemble .ensemble))),
			_ensemble => {{
				var _questions = T (_ensemble) (L .get (ensemble_questions))
				var _rules = T (_ensemble) (L .get (ensemble_rules))
				var _setup = setup .setup (_room, _questions, default_rules)
				;app_state (
					student_app .get_ready ( _student, _setup )) }} ])) )
		.catch (_e => {{
			;lookbehind_state (student_lookbehind .bad_room (_room))
			;console .error (_e) }})
		.then (_ => {{
			;io_state (io .inert) }}) }}

var record_student = _name => {{
	var _setup = T (S .sample (app_state)) (L .get ([ app_setup, as_maybe ]))
	;app_state (
		student_app .get_ready (
			Z .Just ([ uuid (), _name ])
			, _setup )) }}

var connect_room = _ => {{
	;so ((
	take
	, exists = maybe_all (T (app_state ()) (
			L .get (L .pick ({
				_student: [ app_student, as_maybe ],
				_room: [ app_room, as_maybe ] })))) ) => {{
	;T (exists) (Z_ .map (({ _student, _room }) => {{
		var _setup
		;return go 
		.then (_ =>
			io_state (io .connecting) && api (_room)
      .then (panic_on ([ [Z .equals ({}), 'empty room; expired code?'] ]))
			.then ($ [
				 L .get (L .inverse (data_iso (ensemble .ensemble))),
				 _ensemble => {{
					 var _questions = T (_ensemble) (L .get (ensemble_questions))
					 var _rules = T (_ensemble) (L .get (ensemble_rules))
					 ;_setup = setup .setup (_room, _questions, default_rules) }}]) )
		.then (_ =>
			api (_room, post (message_encoding (
				message .student_ping (_student, [0, 0, 0]) )))
			.then (panic_on ([ [_x => ! _x .ok, 'not ok'] ])) )
		.then (_ => {{ 
			;app_state (
				student_app .get_ready (Z .Just (_student), Z .Just (_setup))) }})
		.catch (_e => {{
			;lookbehind_state (student_lookbehind .bad_room (_room))
			;console .error (_e) }})
		.then (_ => {{
			;io_state (io .inert) }}) }})) }} ) }}

var attempt_question = _position => {{
	T (app_state ()) ([ student_app_to_board_viewer,
		Z_ .map (_board_viewer => {{
		//Z_ .chain (board_viewer_current_question),
			var _question = T (_board_viewer) ([ board_viewer_current_question, from_just  ])
			var _board = T (_board_viewer) (L .get (board_viewer_board))
			var _answer = T (_board) (L .get ([ position_lens (_position), cell_answer ]))
			if (! L .get (lookbehind_blocked) (lookbehind_state ())) {
				var latency = game_clock .time () //lookbehind_latency ()
				if (matches_question_answer (_question) (_answer)) {
					;T (app_state ()) ([
						L .set
							([app_history, L .last, rendition_attempts, L .append])
							([_position, latency]),
						student_app_next_playing,
						_x => {{ ;app_state (_x) }} ]) }
				else {
					;T (app_state ()) ([
						L .set
							([app_history, L .last, rendition_attempts, L .append])
							([_position, latency]),
						_x => {{ ;app_state (_x) }} ])
					;lookbehind_state (student_lookbehind .attempting (game_clock .time (), true)) } } }}) ]) }}

var timesup_question = _ => {{
	;app_state (student_app_next_playing (app_state ())) }}












var game_clock = new TimelineMax
var game_tick_sampler = S .data (Z .Nothing)
;game_clock .add (timesup_question, 10)
;T (R .range (0, 10 + 1)) (
	R .forEach (t => game_clock .add (_ => {{ ;game_tick_sampler (Z .Just (t)) }}, t)))


var reping_period = 3
var heartbeat = S .data (reping_period) 

var connection = S (_ => {{
	;return T (app_state ()) ([
		L .get (app_room),
		map_defined (_room => {{
			if (! connection [_room]) {
				;connection [_room] = S .data ()
				;api .listen_ping (_room) (connection [_room]) }
			return connection [_room] () && so ((_=_=>
			[ timestamp, mean, Math .sqrt (variance) ],
			where
			, [ mean, variance, n, timestamp ] = connection [_room] () )=>_) }}) ]) }})




S (_ => {{
  ;so ((
  take
  , cases = 
      [ [ data_iso (feedback .enter_room)
        , ({ room: _room }) => {;
            ;record_room (_room) } ]
      , [ data_iso (feedback .enter_name)
        , ({ name: _name }) => {;
            ;go
            .then (_ => record_student (_name))
            .then (_ => connect_room ()) } ]
      , [ data_iso (feedback .attempt_question)
        , ({ position: _position }) => {;
            ;attempt_question (_position) } ] ] )=>
  so ((_=_=>
  T (just_now (feedback_state)
  ) (
  action),
  where
  , action = 
      Z_ .flip (T (cases) (Z_ .map (_case => so ((_=_=>
        _feedback => {;
          var result = L .get (predicate) (_feedback)
          if (result) {
            ;action (result) } },
        where
        , predicate = _case [0]
        , action = _case [1] )=>_) ))) )=>_)) }})





S (_ => {{
	if (L .isDefined (lookbehind_bad_room) (lookbehind_state ())) {
		;var forget = setTimeout (_ => {{
			;lookbehind_state (student_lookbehind .nothing) }}
		, 1500)
		;S .cleanup (_ => {{
			;clearTimeout (forget) }}) } }})
S (last_app => {{
	if (! L .isDefined (app_room) (last_app)) {
		if (L .isDefined (app_room) (app_state ())) {
			;lookbehind_state (student_lookbehind .nothing) } }
	return app_state () }}
	, app_state ())
S (last_app => {{
	var last_history = T (last_app) (L .get ([app_history])) || []
	var history = T (app_state ()) (L .get ([app_history]))
	if (L .isDefined (app_playing) (app_state ())) {
		if (history_stepped (last_history) (history)) {
			;lookbehind_state (student_lookbehind .attempting (0, false)) } }
	return app_state () }}
	, app_state ())
S (_ => {{
	if (L .get (lookbehind_blocked) (lookbehind_state ())) {
		;var forget = setTimeout (_ => {{
			var _since = T (lookbehind_state ()) (L .get (lookbehind_since))
			;lookbehind_state (student_lookbehind .attempting (_since, false)) }}
		, 3000)
		;S .cleanup (_ => {{
			;clearTimeout (forget) }}) } }})


S (_ => {{
	if (L .isDefined (app_get_ready) (app_state ())) {
		;game_clock .pause () } }})
S (last_state => {{
	var last_history = T (last_state) (L .get ([app_history, L .valueOr ([])]))
	var history = T (app_state ()) (L .get ([app_history]))
	if (L .isDefined (app_playing) (app_state ())) {
		if (history_stepped (last_history) (history)) {
			;game_clock .seek (0) }
		;game_clock .play () }
	return app_state () }}
	, app_state ())
S (_ => {{
	if (L .isDefined (app_game_over) (app_state ())) {
		;game_clock .pause () } }})


S (last_ensemble => {{
	;so ((
	take
	, _app = S .sample (app_state)
	, _ensemble = ensemble_state () ) => {{
	if (L .isDefined (app_get_ready) (_app)) {
		if (! L .isDefined (ensemble_start) (last_ensemble)) {
			if (L .isDefined (ensemble_start) (_ensemble)) {
				var start = T (_ensemble) (L .get (ensemble_start))
				var now = (new Date) .getTime ()

				var playing_app = student_app_get_ready_to_playing (_app)
				if (start > now) {
					;app_state (playing_app) }
				else {
					;setTimeout (_ => {{
						;app_state (playing_app) }}
					, start - now) }

				var _room = T (_app) (L .get (app_room))
				var _student = T (_app) (L .get (app_student))
				;(io_state (io .messaging), api (_room, post (
					message_encoding (
						message .student_start (_student, start)))))
				.catch (_e => {{
					;console .error (_e) }})
				.then (_ => {{
					;io_state (io .inert) }}) } } } }})
	return ensemble_state () }}
	, ensemble_state ())


S (_ => {{
	;so ((
	take
	, exists = maybe_all (T (app_state ()
			) (L .get (L .pick ({
				_student: [ app_student, as_maybe ],
				_room: [ app_room, as_maybe ] })) )) ) => {{
	;T (exists) (Z_ .map (({ _student, _room }) => {{
		var phase = heartbeat ()
		var critical = phase === 1
		go
		.then (_ =>
			!! critical && S .sample (connection)
			? io_state (io .messaging) && api (_room, 
					post (messages_encoding (
						so ((_=_=>
						!! (not_playing)
						? [ message .student_ping (_student, S .sample (connection)) ]
						: [ message .student_ping (_student, S .sample (connection))
							, message .student_join (_student, _board)
							, message .student_update (_student, _history) ],
						where
						, { _board, _history, not_playing } =
								$ (Z .fromMaybe
								) ({ not_playing: fiat }
                ) (maybe_all (T (app_state ()) (L .get (L .pick ({
										_board: [ app_board, as_maybe ],
										_history: [ app_history, as_maybe ] })) ))) )=>_) ))) 
			: io_state (io .heartbeat) && api (_room)
				.then ($ ([
					L .get (L .inverse (data_iso (ensemble .ensemble))),
					_x => {;ensemble_state (_x)} ])) )
		.then (_ => {{
			;setTimeout (_ => {{
				;heartbeat (!! critical ? reping_period : phase - 1) }}
			, 300) }})
		.catch (_e => {{
			;console .error (_e)
			;setTimeout (_ => {{
				;heartbeat (phase) }}
			, 300) }})
		.then (_ => {{
			;io_state (io .inert) }}) }})) }}) }})
