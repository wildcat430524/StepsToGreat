"""Execute only these fixed, maintainer-authored examples; no model code input."""
import contextlib
import io
import json
import platform

CASES = {
    "assignment": 'a = [1, 2]\nb = a\nb.append(3)\nprint(a, b)',
    "nested_shallow_copy": 'groups = [["A"], ["B"]]\nbackup = groups[:]\nbackup[0].append("C")\nbackup.append(["D"])\nprint(groups)\nprint(backup)',
    "replace_outer_slot": 'names = [["A"], ["B"]]\nalias = names[:]\nalias[0] = ["X"]\nnames[1].append("Y")\nprint(names)\nprint(alias)',
    "empty_list": 'draft = []\nmine = draft\nsaved = draft[:]\nmine.append("K")\nprint(draft, mine, saved)\nprint(mine is draft, saved is draft)',
    "single_bracket_typo": 'names = [["A"], ["B"]]\nalias = names[:]\nalias[0] = ["X"\nnames[1].append("Y")',
}

result = {"pythonVersion": platform.python_version(), "cases": {}}
for name, code in CASES.items():
    output = io.StringIO()
    try:
        compiled = compile(code, "<fixed-simulation-example>", "exec")
        with contextlib.redirect_stdout(output):
            exec(compiled, {})
        result["cases"][name] = {"stdout": output.getvalue(), "error": None}
    except SyntaxError as error:
        result["cases"][name] = {"stdout": output.getvalue(), "error": "SyntaxError", "detail": error.msg}
print(json.dumps(result, ensure_ascii=False, indent=2))
