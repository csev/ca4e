# From Stonehenge\index{Stonehenge} to Silicon: Why Computers Began with Numbers

\index{computer architecture}\index{numbers}

Long before computers were used for communication, entertainment, or social interaction, they were built for something far more basic: measuring the world and predicting what would happen next. The earliest forms of computation were not abstract symbols stored in memory, but physical structures designed to model natural processes. These devices helped track the seasons, predict the motion of planets, guide travelers, and support engineering and trade. In this early period, computing was inseparable from mathematics and measurement, and numbers were the primary objects being manipulated.

This focus on numerical calculation remained dominant for most of computing history. Until the late twentieth century, computers were rare, expensive, and primarily used for scientific, military, and industrial purposes. There was no internet, and few people interacted directly with computing machines. Only later did computers become tools for information exchange and personal communication. To understand modern computer architecture, it helps to begin with this earlier world, where computation meant physically transforming numbers.

---

## Curved Motion and the Need for Prediction

Much of the natural world moves along curves rather than straight lines. The arc of a thrown object, the path of the Moon across the sky, and the orbit of planets all follow curved trajectories. Predicting such motion is difficult\index{prediction}\index{astronomy} because small errors accumulate over time, and precise prediction requires repeated calculation. While the human brain is good at intuitive estimates, accurate forecasting requires systematic measurement and mathematical modeling.

The practical need to predict motion—for agriculture, navigation\index{navigation}, and astronomy—drove the development of early computational tools. These tools were not general-purpose machines, but specialized devices that captured particular physical relationships and made them easier to reason about. Each device encoded a small piece of mathematics in wood, stone, or metal.

---

## Astronomy and Physical Data Tables

From the earliest civilizations, careful observation of the sky revealed repeating patterns. The positions of the Sun, Moon, and stars changed in predictable ways over the course of days, months, and years. Recording these observations allowed calendars to be built, planting seasons to be planned, and ceremonial events to be scheduled.

Over time, physical structures were constructed to embody these patterns directly. Instead of writing numbers in tables, builders placed stones or architectural features so that sunlight or shadows would align at particular times of year. These structures functioned as durable, physical data sets that could be read simply by observing the environment.

![Seasonal sunrise and sunset alignment at Stonehenge](images/ch01-stonehenge-sunrise.png)

---

## Stonehenge as a Measuring Device

Stonehenge, constructed in several phases between roughly 5100 and 3600 years ago, illustrates this idea clearly. The arrangement of stones aligns with sunrise and sunset positions that change throughout the year. By observing which stones line up with the Sun on a given day, seasonal transitions can be predicted.

Rather than storing numbers, Stonehenge stored geometric relationships. Over many generations, observations were effectively "written" into the landscape. In modern terms, the structure can be thought of as a calibrated data table, built incrementally through centuries of refinement.

Similar solar and lunar alignment structures exist across many cultures, from temples in India to monuments in Central America. All reflect the same underlying idea: physical construction can encode numerical patterns from nature.

> Physical computing did not begin with machines. It began with architecture.

---

## Continuous Representations of Number

Many early computational devices represented numbers not as symbols, but as physical positions. A value might correspond to the angle of a gear, the distance of a slider, or the rotation of a dial. Because these values could vary smoothly, such systems are called continuous or analog\index{analog computing}.

In these devices, mathematical relationships are built into geometry. Adding distances can perform multiplication when scales are logarithmic. Rotating disks can solve trigonometric problems by turning angles into lengths. Instead of executing arithmetic step by step, the device produces results through physical alignment.

Accurate printed scales are essential for this approach. The precision of the computation depends directly on the precision of the markings and the mechanical stability of the device. In effect, the manufacturing process becomes part of the calculation.

---

## Gears as Models of the Solar System

![Antikythera mechanism gear layout](images/ch01-antikythera-gears.png){height=300px}

The Antikythera mechanism\index{Antikythera mechanism}, dating to around 2100 years ago, represents one of the most sophisticated examples of ancient analog computing. This device used interlocking gears to model the motion of the Sun, Moon, and known planets. Some of its gear trains represented long astronomical cycles spanning decades or even centuries.

Rather than calculating planetary positions numerically, the mechanism physically enacted the model of the cosmos that astronomers had developed. Turning a crank advanced time, and the gears moved accordingly. The computation occurred through mechanical interaction, not through written arithmetic.

This illustrates a broader principle that remains true today: computing systems implement models of reality. Whether those models are built from bronze gears or silicon transistors, the purpose is the same—to predict behavior by simulating it.

---

## Practical Analog Computing

![Slide rule logarithmic scales](images/ch01-sliderule-scales.png)

Analog computation did not remain confined to astronomy. Devices such as slide rules\index{slide rule} transformed multiplication into addition by using logarithmic scales. By aligning and sliding rulers, complex calculations could be performed quickly and reliably.

A particularly practical example is the E6B flight computer\index{E6B flight computer}, still used by pilots to compute wind correction angles and ground speed. By rotating dials and aligning scales, trigonometric relationships are solved graphically. The device does not know anything about airplanes; it simply encodes geometric laws that apply to moving vectors.

In each case, the key idea is that physical movement stands in for mathematical transformation. The device performs computation because its shape embodies mathematical relationships.

---

## Discrete States and Digital Devices

\index{digital}\index{discrete state}

Not all physical computation is continuous. Some devices operate using discrete, stable states. A mechanical latch, for example, stays in one of two positions until enough force is applied to switch it. These stable configurations allow information to be stored physically.

Clocks provide a clear example of digital behavior in mechanical systems. A pendulum provides regular timing, while ratchets and gears count discrete events. When one gear completes a full rotation, it advances the next gear, producing the familiar progression from seconds to minutes to hours.

![Clock gear train with carry propagation](images/ch01-clock-carry.png)

This mechanism also introduces the concept of carry\index{carry}. When one digit overflows, the next digit is incremented. Mechanical systems must physically propagate this carry through connected components, a process that takes time and introduces delays. Similar effects still occur in electronic circuits, where signals must travel between components.

---

## Iteration and Mechanical Automation

\index{iteration}

Once addition and counting are possible, repeated operations can be automated. Multiplication becomes repeated addition, and polynomial evaluation becomes a structured sequence of arithmetic steps. Adding motors or cranks allows machines to perform long sequences without human intervention.

Charles Babbage’s Difference Engine\index{Difference Engine}\index{Babbage, Charles}, designed in the nineteenth century, exploited this idea. It used repeated addition to approximate complex mathematical functions and generate accurate tables. Although technology at the time could not easily produce all the required parts, a complete version built in the late twentieth century demonstrated that the design itself was sound.

> Architectural ideas often appear long before manufacturing technology can fully support them.

---

## Human Computers and Early Programming

\index{human computers}\index{programming}

Before electronic machines became common, teams of people performed large calculations using mechanical aids and strict procedures. These workers were called computers, and their job was to execute long sequences of operations reliably.

When electronic computers emerged, much of this procedural knowledge transferred directly. Programming languages such as FORTRAN reflected existing mathematical workflows, including loops and accumulation of results. Writing a program was, in many ways, formalizing what human computers had already been doing manually.

Thus, programming did not arise as a completely new activity. It evolved naturally from structured numerical work that had existed for generations.

---

## From Mechanical to Electronic Switching

Mechanical systems are limited by friction, wear, and inertia. As machines grew faster and more complex, these physical limits became obstacles. Vacuum tubes\index{vacuum tubes} offered a way to perform switching electronically, without moving parts.

![Vacuum tubes in the Colossus](images/ch01-vacuum-tube-switch.png)

Although tubes are inherently analog devices, additional circuitry allowed them to behave digitally by latching into stable high or low voltage states. Machines such as Colossus\index{Colossus} used thousands of tubes to perform computations far faster than electromechanical systems could achieve.

Heat and power consumption remained serious challenges, but electronic switching marked a fundamental shift. Computation was no longer constrained by mechanical motion.

---

## Why Architecture Begins with Numbers

Across thousands of years, computational devices were developed to support astronomy, navigation, engineering, and accounting. These systems manipulated numbers that represented physical quantities: time, distance, angle, and mass. The architectural ideas that emerged—counting, carrying, iteration, state, and switching—remain central to computer design today.

Only later did computers become tools for processing text, images, and communication. Those capabilities were built on top of numerical foundations that had already been refined through centuries of physical computing devices.

Understanding this origin helps explain why modern processors still devote most of their structure to arithmetic and control of repeated operations.

---

## What Comes Next

The transition from mechanical and electronic switching to solid-state devices\index{transistor}\index{solid-state} transformed both the speed and scale of computation. In the next chapter, attention turns to how transistors replaced tubes and gears, and how tiny electrical switches became the building blocks of modern computer systems.
