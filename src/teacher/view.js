var Z = sanctuary


var defined

var number = defined
var list = a => defined
var maybe = a => defined

var data = constructors






var fro = (from_nothing, from_just) => (maybe = maybe) => 
  Z .reduce ((_, x) => from_just (x), from_nothing, maybe)


var progress = number
var setup = data ({ setup: ( list (student), room, list (question), game_rules ) => defined })

var game_rules = data ({
  rules: (time_limit = number, size = number) => defined })
var default_rules = game_rules .rules (10, 10)

var state = data ({
	before: ( room = maybe (room), students = list (student), questions = list (questions), rules = game_rules ) => defined,
	during: ( completed_questions = progress, setup = setup ) => defined,
	after: () => defined })


var now_state = S .data (
  state .before (Z .Nothing), [], [], default_rules)



window .view = <div>
	{ Oo (before_state (), oo (fro (Z .Nothing, x => x .)), oo (fro ('Generating Code', x => 'Room: ' + room))) }
</div>




var get_room = _ => {;
	var id = Oo (Math .random (),
		oo (x => x * 100000000),
		oo (x => Math .floor (x)))
	
	fetch ('/log/' + id)
	.then (x => x .json ())
	.then (x => {;
		if (x .length === 0) {
			;room (id)}
		else {
			;throw 'taken' }})
	.catch (_ => {;get_room ()}) }
;get_room ()