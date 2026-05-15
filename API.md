# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### AlternateContactConfigurer <a name="AlternateContactConfigurer" id="alternate-contact-configurer.AlternateContactConfigurer"></a>

#### Initializers <a name="Initializers" id="alternate-contact-configurer.AlternateContactConfigurer.Initializer"></a>

```typescript
import { AlternateContactConfigurer } from 'alternate-contact-configurer'

new AlternateContactConfigurer(scope: Construct, id: string)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#alternate-contact-configurer.AlternateContactConfigurer.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#alternate-contact-configurer.AlternateContactConfigurer.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="alternate-contact-configurer.AlternateContactConfigurer.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="alternate-contact-configurer.AlternateContactConfigurer.Initializer.parameter.id"></a>

- *Type:* string

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#alternate-contact-configurer.AlternateContactConfigurer.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#alternate-contact-configurer.AlternateContactConfigurer.with">with</a></code> | Applies one or more mixins to this construct. |

---

##### `toString` <a name="toString" id="alternate-contact-configurer.AlternateContactConfigurer.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="alternate-contact-configurer.AlternateContactConfigurer.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="alternate-contact-configurer.AlternateContactConfigurer.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

The mixins to apply.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#alternate-contact-configurer.AlternateContactConfigurer.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="alternate-contact-configurer.AlternateContactConfigurer.isConstruct"></a>

```typescript
import { AlternateContactConfigurer } from 'alternate-contact-configurer'

AlternateContactConfigurer.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="alternate-contact-configurer.AlternateContactConfigurer.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#alternate-contact-configurer.AlternateContactConfigurer.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |

---

##### `node`<sup>Required</sup> <a name="node" id="alternate-contact-configurer.AlternateContactConfigurer.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---





