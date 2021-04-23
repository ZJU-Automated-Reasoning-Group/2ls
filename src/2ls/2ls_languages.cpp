/*******************************************************************\

Module: Language Registration

Author: Daniel Kroening, kroening@kroening.com

\*******************************************************************/

/// \file
/// Language Registration

#include <langapi/mode.h>

#include <ansi-c/ansi_c_language.h>
#include <cpp/cpp_language.h>

#include "2ls_parse_options.h"

void twols_parse_optionst::register_languages()
{
  register_language(new_ansi_c_language);
//  register_language(new_cpp_language);
//  register_language(new_java_bytecode_language);
}
